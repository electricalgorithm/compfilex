const socket = io("/", {
    extraHeaders: {
        connType: "web-client"
    }
});

var settingUse = (setNo) => {
    if (setNo == undefined) return;
    socket.emit("setting_use", setNo);
}

var settingDelete = (setNo) => {
    if (setNo == undefined) return;
    socket.emit("setting_delete", setNo);
}

socket.on("conf_setting_use", object => {
    if (object.status != "OK") return;

    // Showing a snackbar message.
    var snackBar = document.querySelector("#snackbar");
    snackBar.innerHTML = object.message;
    snackBar.className = "show";
    setTimeout(() => {
        snackBar.className = snackBar.className.replace("show", "");
    }, object.redirect[2])

    // Redirect page to dashboard.
    if (object.redirect[0]) setTimeout(() => {
        window.location = object.redirect[1];
    }, object.redirect[2] + 250)
})

socket.on("conf_setting_delete", object => {
    if (object.status != "OK") return;
    
    // Showing a snackbar message.
    var snackBar = document.querySelector("#snackbar");
    snackBar.innerHTML = object.message;
    snackBar.className = "show";
    setTimeout(() => {
        snackBar.className = snackBar.className.replace("show", "");
    }, 1500)

    // Reload page.
    setTimeout(() => {
        window.location.reload()
    }, 1500)
})