function getUserList()
{
    let opts = { 
        "pageSize": 100, // Number | Page size
        "pageNumber": 1, // Number | Page number
        //"id": ["id_example"], // [String] | A list of user IDs to fetch by bulk
        //"jabberId": ["jabberId_example"], // [String] | A list of jabberIds to fetch by bulk (cannot be used with the id parameter)
        "sortOrder": "ASC", // String | Ascending or descending sort order
        //"expand": ["expand_example"], // [String] | Which fields, if any, to expand
        //"integrationPresenceSource": "integrationPresenceSource_example", // String | Gets an integration presence for users instead of their defaults. This parameter will only be used when presence is provided as an expand. When using this parameter the maximum number of users that can be returned is 100.
        "state": "active" // String | Only list users of this state
    };

    // Get the list of available users.
    return userApiInstance.getUsers(opts)
        .then(data => 
        {
            users = data.entities.reduce((obj, currentValue) =>
            {
                obj[currentValue.id] = currentValue;
                return obj;
            }, {});
            console.log("forHim " + users);
            //console.log(`getUsers success! data: ${JSON.stringify(data, null, 2)}`);
        })
        .catch(err =>
        {
            console.log("There was a failure calling getUsers");
            console.error(err);
        });
}

function getUsersStatusList()
{
    var samplePresences = [
        {
          "userId": "d2dab52a-8588-4942-8d44-fd8a2aa5d4a2",
          "source": "PURECLOUD",
          "presenceDefinition": {
            "id": "6a3af858-942f-489d-9700-5f9bcdcdae9b",
            "systemPresence": "Available",
            "selfUri": "/api/v2/presencedefinitions/6a3af858-942f-489d-9700-5f9bcdcdae9b"
          },
          "message": "",
          "modifiedDate": "2023-08-21T15:54:31.904Z",
          "selfUri": "/api/v2/users/d2dab52a-8588-4942-8d44-fd8a2aa5d4a2/presences"
        },
        {
          "userId": "30a95f8c-d73e-463f-a72c-bff2c10925bc",
          "source": "PURECLOUD",
          "presenceDefinition": {
            "id": "04b4342f-7518-4c9b-8b1e-1e15e713ca7f",
            "systemPresence": "Meeting",
            "selfUri": "/api/v2/presencedefinitions/04b4342f-7518-4c9b-8b1e-1e15e713ca7f"
          },
          "message": "To define is to limit",
          "modifiedDate": "2023-08-21T13:56:49.485Z",
          "selfUri": "/api/v2/users/30a95f8c-d73e-463f-a72c-bff2c10925bc/presences"
        }
      ];

      let userId = "d2dab52a-8588-4942-8d44-fd8a2aa5d4a2"; // String | user Id

    Object.values(users).forEach(user => 
    {
        presenceApiInstance.getUserPresencesPurecloud(user.id)
        .then(presence => 
        {
            user.status = {
                id: presence.presenceDefinition.id,
                systemPresence: findExactStatusinList(presence.presenceDefinition.id), //presence.presenceDefinition.systemPresence,
                modifiedDate: presence.modifiedDate
            };
            /*if(user.status.systemPresence == "Offline")
                delete users[user.id]*/
            
          //console.log(`getUserPresencesPurecloud success! data: ${JSON.stringify(data, null, 2)}`);
        })
        .catch((err) => {
          console.log("There was a failure calling getUserPresencesPurecloud");
          console.error(err);
        });         
    })

        /*
      function findStatusOnebyOne(data)
      {
        var presence = data.status;

        var user = users[presence.userId];
        user.status = {
            id: presence.presenceDefinition.id,
            systemPresence: presence.presenceDefinition.systemPresence,
            modifiedDate: presence.modifiedDate
        };
      }
*/

    /*samplePresences.forEach(presence =>
    {
        var user = users[presence.userId];
        user.status = {
            id: presence.presenceDefinition.id,
            systemPresence: presence.presenceDefinition.systemPresence,
            modifiedDate: presence.modifiedDate
        };
    });*/

    var user = users["d2dab52a-8588-4942-8d44-fd8a2aa5d4a2"];

    //Object.values(users).find(i => i.name == "Mert"); //first
    //Object.values(users).filter(i => i.status == "Active"); // Where

    console.log(user.id);
    console.log(user.name);
    console.log(user.division.name);
/*
    let opts = {
        id: ["d2dab52a-8588-4942-8d44-fd8a2aa5d4a2", "30a95f8c-d73e-463f-a72c-bff2c10925bc"]
    };

    return presenceApiInstance
        .getUsersPresencesPurecloud(opts) //getUsersPresencesPurecloudBulk(opts)
        .then((data) =>
        {
            console.log(`getUsersPresencesPurecloudBulk success! data: ${JSON.stringify(data, null, 2)}`);
        })
        .catch((err) => {
            console.log("There was a failure calling getUsersPresencesPurecloudBulk");
            console.error(err);
        });*/
}

function getUsersConversationList()
{
    conversationsApi.getConversationsCalls()
    .then((data) => 
    {
        var conversations = data.entities;
        conversations.forEach(conversation =>
        {
            var user = users[conversation.participants[0].user.id];
            user.conversation = {
                id: conversation.participants[0].id,
                state: conversation.participants[0].state,
                startedDate: conversation.participants[0].startTime
            };
        });

      //console.log(`getConversationsCalls success! data: ${JSON.stringify(data, null, 2)}`);
    })
    .catch((err) => {
      console.log("There was a failure calling getConversationsCalls");
      console.error(err);
    });
}

function findExactStatusinList(presenceId)
{
    return statusList.find(({ id }) => id === presenceId).languageLabels.en_US;
}