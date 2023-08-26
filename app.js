function setStatus (userId, statusId)            
{
    presenceApiInstance.patchUserPresence(userId, 'PURECLOUD', { presenceDefinition:{ id: statusId } })
    .then(() => {
        console.log('Presence set successfully ' + userId + " " + statusId);
    })
    .catch((err) => console.error(err)); 
}

function setStatusViaSocket(userId, statusId, modifiedDate)
{
    document.getElementById(userId).value=statusId;
    document.getElementById(users[userId].name + "_modifiedDate").setAttribute("name", modifiedDate);
}

function setInteractionViaSocket(userId, state, startedDate)
{
    if(state == "disconnected" || state == "terminated")
    {
        document.getElementById(users[userId].name + "_state").setAttribute("for", "");
        document.getElementById(users[userId].name + "_state").setAttribute("name", "");
        document.getElementById(users[userId].name + "_state").innerHTML = state;
        setStatus(userId, "6a3af858-942f-489d-9700-5f9bcdcdae9b", startedDate);
    }
    else
    {
        if(state == "connected")
        {
            document.getElementById(users[userId].name + "_state").setAttribute("for", state);
            document.getElementById(users[userId].name + "_state").setAttribute("name", startedDate);
            document.getElementById(users[userId].name + "_state").innerHTML = state;

            setStatus(userId, "ebc7a155-48fa-4009-82ef-8d32753da23a", startedDate);            
        }
        else
            document.getElementById(users[userId].name + "_state").innerHTML = state;
    }
}
            
function dueInCalculation(diffMinutes)
{
    if (diffMinutes < 0) //overdue
    {
        if (diffMinutes > -60)
        return Math.abs(diffMinutes) + " minutes overdue";
        else
        return Math.round(Math.abs(diffMinutes / 60)) + " hour(s) overdue";
    }
    else //due in
    {
        if (diffMinutes < 60)
        return "due in " + diffMinutes + " minutes";
        else
        return "due in " + Math.round(Math.abs(diffMinutes / 60)) + " hour(s)";
    }
}

function dateFormat(dateTime)
{
    var month = dateTime.getMonth() + 1;

    var formattedDateTime = dateTime.getFullYear() + "-" + 
    (month < 10 ? "0" + month : month) + "-" + 
    (dateTime.getDate() < 10 ? "0" + dateTime.getDate() : dateTime.getDate()) + " " +
    (dateTime.getHours() < 10 ? "0" + dateTime.getHours() : dateTime.getHours()) + ":" + 
    (dateTime.getMinutes() < 10 ? "0" + dateTime.getMinutes() : dateTime.getMinutes());

    return formattedDateTime;
}

function getTimeDiffinHHmmss(modifiedDate)
{
    var tempModifiedDate = new Date(modifiedDate);
    var dateNow = new Date();

    var diff = dateNow.getTime() - tempModifiedDate.getTime(); // this is a time in milliseconds
    //var diff_as_parsed = Math.floor(diff / 1000 / 60 / 60) + ":" + Math.floor(diff / 1000 / 60);

    var sec_num = parseInt(diff / 1000, 10); // don't forget the second param
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}     

    if(hours == 0)
        return minutes+':'+seconds;
    else
        return hours+':'+minutes+':'+seconds;
}
