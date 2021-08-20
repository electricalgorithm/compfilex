const express = require("express")
const path = require("path")
const ejs = require("ejs")
const config = require("../config.env")
router = express.Router()


// Every user creates a session ID whenever they enter the website. This session ID (sID)
// stored on the cookies. If a registered user logs into the system, the sID number will be
// stored on the sessions database. Session datum keeps sID number, login userName,
// expiration date of the sID, and isAuth property. "isAuth" property is the main thing if one
// wants to check user logged in or not. After login process, server makes that session's
// isAuth property "true". Whenever that session's user tries to open a restricted page,
// server check if he/she got "isAuth = true". Likewise, after pressing logout button,
// server deletes that session from the database, and assing the user new sID.
// That's how login/logout procces work. The function below is a middleware for the pages
// we want to restrict from non-registered users.
const isAuth = (req, res, next) => {
    if (req.session.isAuth) {
        next()
    } else {
        req.session.error = "You have to login first.";
        res.redirect("/login")
    }
}

// Sample get routes for HTML pages.
router.get("/", (req, res) => {
    res.redirect("/dashboard");
})

router.get("/register", (req, res) => {
    res.render("register", {
        site_name: config.SITE_NAME,
        site_description: config.SITE_DESCRPTION,
        page_name: "Register",
        current_year: (new Date).getFullYear(),
        req_auth: req.session.isAuth
    })
})

router.get("/login", (req, res) => {
    res.render("login", {
        site_name: config.SITE_NAME,
        site_description: config.SITE_DESCRPTION,
        page_name: "Login",
        current_year: (new Date).getFullYear(),
        req_auth: req.session.isAuth
    })
})

// Dashboard page is restricted from non-registered users.
// That's why we got isAuth function in the parameter list. 
router.get("/dashboard", isAuth, (req, res) => {
    res.render("dashboard", {
        page_name: "Dashboard",
        user_name: req.session.username,
        site_name: config.SITE_NAME,
        site_description: config.SITE_DESCRPTION,
        current_year: (new Date).getFullYear()
    })
})

router.get("/saved-settings", isAuth, (req, res) => {
    res.render("saved-settings", {
        page_name: "Saved Settings",
        user_name: req.session.username,
        site_name: config.SITE_NAME,
        site_description: config.SITE_DESCRPTION,
        current_year: (new Date).getFullYear(),
        req_auth: req.session.isAuth
    })
})

module.exports = router