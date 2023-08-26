let platformClient;

var lifecycleStatusMessageTitle = 'Lifecycle Demo App';
var lifecycleStatusMessageId = 'lifecycleDemo-statusMsg';
var blurCount = 0;
var userApiInstance;
var presenceApiInstance;
var conversationsApi;
var analyticsApi;
var routingApi;
var notificationsApi;
var outboundApi;
var userId;
// Local vars
var presences = {};
var userPresenceTopic = '';
var userPresenceTopicArr = [];
var webSocket = null;
var me, notificationChannel, conversationsTopic;
var CONVERSATION_LIST_TEMPLATE = null;
var conversationList = {};     
var customerIdKeepFor;
var phoneNumberKeepFor;
var scheduledTimeKeepFor;
var agentNameKeepFor;
var callbackOrNot = false;
var users = {};
var statusList = [];
//npm install -g local-ssl-proxy
// local-ssl-proxy --source 6500 --target 5500
//const REDIRECT_URI = "https://nesinkisen.github.io";
const REDIRECT_URI = "http://localhost:5500";  
var client;

$(function() 
{
    platformClient = require('platformClient');

    client = platformClient.ApiClient.instance;
    
    //client.setEnvironment(platformClient.PureCloudRegionHosts.us_east_1); // Genesys Cloud region
    client.setEnvironment(platformClient.PureCloudRegionHosts.eu_west_1);

    // Create API instance
    //const usersApi = new platformClient.UsersApi();
    userId = "d2dab52a-8588-4942-8d44-fd8a2aa5d4a2"; // String | user Id    
    
    userApiInstance = new platformClient.UsersApi();
    presenceApiInstance = new platformClient.PresenceApi();
    conversationsApi = new platformClient.ConversationsApi();
    analyticsApi = new platformClient.AnalyticsApi(); 
    routingApi = new platformClient.RoutingApi();       
    notificationsApi = new platformClient.NotificationsApi();
    outboundApi = new platformClient.OutboundApi(); 

    // Authenticate
    client
    .loginImplicitGrant("4661d5c1-d791-478f-b440-3cc36f9cb882", REDIRECT_URI)
    .then(getUserList)
    .then(getStatusList).then(afterStatusList)
    .then(getUsersStatusList)
    .then(getUsersConversationList)
    .then(getUsersMe).then(afterUsersMe)
    .then(getChannels).then(afterChannels)
    .then(onStart)
    .then(hideOfflineUsers)
    .catch(handleErrors);
});
// Handle incoming Genesys Cloud notification from WebSocket
function handleNotification(message) 
{
// Parse notification string to a JSON object
    const notification = JSON.parse(message.data);

    var str = notification.topicName, //bu bolum topic url'inden userid ayiklayabilmek icin. gelmiyor cunku notification icinden.
    delimiter = '.',
    start = 2,
    end = 3,
    tokens = str.split(delimiter).slice(start, end),
    userId = tokens.join(delimiter);

    if(typeof notification.eventBody.presenceDefinition !== 'undefined')
    {            
        var user = users[userId]; //status degisikliginin ana users objesine eklenebilmesi icin. id ile obje icinden cekip, degisiklikleri ekliyoruz
        var oldStatus = user.status.systemPresence;
        user.status = 
        {
            id: notification.eventBody.presenceDefinition.id,
            systemPresence: findExactStatusinList(notification.eventBody.presenceDefinition.id),
            modifiedDate: notification.eventBody.modifiedDate
        };

        if (oldStatus == "Offline" && user.status.systemPresence != "Offline") //hideoffline checkbox secili iken offline olan biri available busy biseye gecerse table'a eklenebilsin diye refresh.
        {
            if ($('#chkHideOfflineUsers').is(':checked')) //ama hideoffline secili degil, yani butun agentlar gorunuyorsa, bisey yapma
            {
                AddAllItemsToTable();
                hideOfflineUsers();
            }
        }
        else if (oldStatus != "Offline" && user.status.systemPresence == "Offline")
        {
            if ($('#chkHideOfflineUsers').is(':checked'))
                hideOfflineUsers();
        }

        setStatusViaSocket(userId, notification.eventBody.presenceDefinition.id, notification.eventBody.modifiedDate)
        document.getElementById(userId + "_td2").setAttribute("style", "background-color:" + findStatusBackgroundColor(findExactStatusinList(notification.eventBody.presenceDefinition.id)));       
    }
    else
    {
        if(typeof notification.eventBody.participants[1].calls[0].connectedTime !== 'undefined')
        {
            setInteractionViaSocket(userId, notification.eventBody.participants[1].calls[0].state,
                                    notification.eventBody.participants[1].calls[0].connectedTime)
        }
        else
            setInteractionViaSocket(userId, notification.eventBody.participants[1].calls[0].state);
    }
}

// Determines if a conversation is disconnected by checking to see if all participants are disconnected
function isConversationDisconnected(conversation)
{
	let isConnected = false;
	conversation.participants.some((participant) =>
    {
		if (participant.state !== 'disconnected')
        {
			isConnected = true;
			return true;
		}
	});

	return !isConnected;
}

function getStatusList()
{
    // Get presences
    return presenceApiInstance.getPresencedefinitions({ pageSize: 100 });
}

function afterStatusList(presenceListing)
{
    //console.log(`Found ${presenceListing.entities.length} presences`);
    statusList = presenceListing.entities;

    var element = {};
    // Create button for each presence
    /*
    presenceListing.entities.forEach((presence) => {
        //presences[presence.id] = presence;
        element.id = presence.id;
        element.statusName = presence.systemPresence;
        statusList.push(element);

        $('div#presenceButtons').append($('<button>')
            .addClass('btn btn-primary')
            .click(() => setPresence(presence.id))
            .text(presence.languageLabels.en_US)
        );
        
    });*/
}

function getUsersMe()
{
    // Get authenticated user's data, including current presence
    return userApiInstance.getUsersMe({ expand: ['presence'] });
}

function afterUsersMe(userMe)
{
    me = userMe;
    // Set current presence text in UI
    //$('#currentPresence').text(presences[me.presence.presenceDefinition.id].languageLabels.en_US);
}

async function getChannels()
{
    // Create notification channel
    
    const channel = await notificationsApi.postNotificationsChannels();
    console.log("channel: ", channel);

    return channel;
}

async function afterChannels(channel)
{
    console.log('channelStatus: ', channel);
    notificationChannel = channel;

    // Set up web socket
    webSocket = new WebSocket(notificationChannel.connectUri);
    webSocket.onmessage = handleNotification;

    // Subscribe to authenticated user's presence
    userPresenceTopic = `v2.users.${me.id}.presence`;
    //userPresenceTopicArr = ["v2.users.${me.id}.presence", "v2.users.30a95f8c-d73e-463f-a72c-bff2c10925bc.presence"];
    
    Object.keys(users).forEach(id => 
    {
        userPresenceTopicArr.push(`v2.users.${id}.presence`);
        userPresenceTopicArr.push(`v2.users.${id}.conversations`);
    })

    const body = userPresenceTopicArr;
    /*const body = [userPresenceTopic, `v2.users.30a95f8c-d73e-463f-a72c-bff2c10925bc.presence`,
    `v2.users.d2dab52a-8588-4942-8d44-fd8a2aa5d4a2.conversations`];*/
    
    const putChannel = await notificationsApi.putNotificationsChannelSubscriptions(notificationChannel.id, body);
    console.log("putChannel", putChannel);

    return putChannel;
}

function onStart()
{
    AddAllItemsToTable();

	var div = document.getElementById('loaderContainer');
    div.style.visibility = 'hidden';    
}

function handleErrors(err)
{
    // Handle failure response
    console.error(err);
}