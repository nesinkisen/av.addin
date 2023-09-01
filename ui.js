//const { ScriptsApi } = require("purecloud-platform-client-v2");
var tbody;

$(function() 
{
    var dateNow = new Date();
    $('#datetimepicker1').datetimepicker({
        format: 'YYYY-MM-DD HH:mm',
        defaultDate: dateNow
    });

    $("#chkHideOfflineUsers").change(function() 
    {
        if(this.checked) 
        {
            hideOfflineUsers();
        }
        else
        {
            AddAllItemsToTable();
        }
        
    });     

    tbody = document.getElementById('tbody1');

    //$("#btnGet").on("click", GetCallbacks);

    /*
    let opts = { 
        "expand": ["expand_example"], // [String] | Which fields, if any, to expand.
        "integrationPresenceSource": "integrationPresenceSource_example" // String | Get your presence for a given integration. This parameter will only be used when presence is provided as an expand.
    };
    */           

    loadFrame();

    startTimers();
});

function loadFrame()
{
    if (document.getElementById(REDIRECT_URI))
    {
        var frameWindow = document.getElementById(REDIRECT_URI).contentWindow;

        frameWindow.addEventListener("load", function()
        {
            var doc = iframe.contentDocument || iframe.contentWindow.document;
            var target = doc.getElementById("https://apps.mypurecloud.ie");

            target.innerHTML = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
            console.warn(target.innerHTML);
        });
    }
}

function startTimers()
{
    var intervalId = window.setInterval(function()
    {
        var gridData = document.getElementById('gridData');
        for (var i = 1, row; row = gridData.rows[i]; i++) 
        {
            gridData.rows[i].cells[3].innerHTML = 
                getTimeDiffinHHmmss(document.getElementById(gridData.rows[i].cells[0].innerHTML + "_modifiedDate").getAttribute("name"));

            if(gridData.rows[i].cells[2].innerHTML !=="")
            {
                if(gridData.rows[i].cells[2].innerHTML.includes("disconnected") || gridData.rows[i].cells[2].innerHTML.includes("terminated"))
                {
                    document.getElementById(users[userId].name + "_state").innerHTML = "";
                }                
                else if(gridData.rows[i].cells[2].innerHTML.includes("connected"))
                {
                    gridData.rows[i].cells[2].innerHTML = 
                                            document.getElementById(gridData.rows[i].cells[0].innerHTML + "_state").getAttribute("for") + ": " +
                        getTimeDiffinHHmmss(document.getElementById(gridData.rows[i].cells[0].innerHTML + "_state").getAttribute("name"));
                }              
            }          
        }                              

    }, 1000);
}

function AddItemToTable(userId, agent, statusId, modifiedDate, conversationState, startedDate)
{
    var diff_status_time_parsed = getTimeDiffinHHmmss(modifiedDate);
    var diff_interaction_time_parsed;
    if(startedDate !== "")
        diff_interaction_time_parsed = conversationState + ": " + getTimeDiffinHHmmss(startedDate);                
    else
        diff_interaction_time_parsed = "";

    let trow = document.createElement("tr");
    trow.setAttribute("id", userId + "_row");

    let td1 = document.createElement("td");
    let td2 = document.createElement("td");
    let td3 = document.createElement("td");
    let td4 = document.createElement("td");

    td1.innerHTML = agent;

    td3.innerHTML = diff_interaction_time_parsed;
    td3.setAttribute("style", "font-size:16px;");
    td3.setAttribute("id", agent + "_state");
    td3.setAttribute("for", conversationState);
    td3.setAttribute("name", startedDate);
    
    td4.innerHTML = diff_status_time_parsed;
    td4.setAttribute("id", agent + "_modifiedDate");
    td4.setAttribute("name", modifiedDate);

    //Create and append select list
    var selectList = document.createElement("select");
    selectList.setAttribute("id", userId);
    selectList.setAttribute("name", agent);
    //selectList.id = "statusSelect";
    td2.appendChild(selectList);
    td2.setAttribute("id", userId + "_td2");

    var option;

    //Create and append the options
    for (var i = 0; i < statusList.length; i++) 
    {
        if(statusList[i].languageLabels.en_US != "Available" && statusList[i].languageLabels.en_US != "Break" &&
            statusList[i].languageLabels.en_US != "Meeting") 
        {        
            option = document.createElement("option")    
            option.value = statusList[i].id;
            option.text = statusList[i].languageLabels.en_US;
            selectList.appendChild(option);
        }
    }                
    selectList.value = statusId; // combo icinden seciyor
    var statusColor = findStatusBackgroundColor(findExactStatusinList(statusId));
    td2.setAttribute("style", "background-color:" + statusColor)

    selectList.onchange = function () 
    {
        setStatus(selectList.getAttribute("id"), selectList.value)
        var statusColor = findStatusBackgroundColor(findExactStatusinList(selectList.value));
        td2.setAttribute("style", "background-color:" + statusColor)        
        //console.log(selectList.value);
        //console.log("status............ + " + selectList.getAttribute("name") + " .. " + selectList.getAttribute("id"));
    };    

    trow.appendChild(td1);
    trow.appendChild(td2);
    trow.appendChild(td3);
    trow.appendChild(td4);

    tbody.appendChild(trow);
}

function AddAllItemsToTable()
{
    tbody.innerHTML = "";
    Object.keys(users).forEach(key => 
    {
        AddItemToTable(users[key].id, users[key].name, users[key].status.id, users[key].status.modifiedDate,
                        (typeof users[key].conversation === 'undefined') ? "" : users[key].conversation.state,
                        (typeof users[key].conversation === 'undefined') ? "" : users[key].conversation.startedDate);
    })
}
function addHours(date, hours) 
{
    date.setTime(date.getTime() + hours * 60 * 60 * 1000);
    return date;
}

function findStatusBackgroundColor(statusName)
{
    if(statusName == "Available")
        return "green";
    else if(statusName == "Busy")
        return "red";
    else if(statusName == "One-on-One" || statusName == "Staff Meeting" || statusName == "Preparing")
        return "orange";    
    else if(statusName == "On Call")
        return "#A000D8";    
    else if(statusName == "Away")
        return "#0233BD";  
    else if(statusName == "Idle")
        return "#E7E001";
}

function hideOfflineUsers()
{
    var table = document.getElementById("gridData");
    for (var i = 1, row; row = table.rows[i]; i++) 
    {
       for (var j = 0, col; col = row.cells[j]; j++) 
       {
        if(j == 1 && $("#" + row.cells[j].id + " :selected").text() == "Offline")
        {
            table.deleteRow(i);
            i = 0;
        }
       }  
    } 
}