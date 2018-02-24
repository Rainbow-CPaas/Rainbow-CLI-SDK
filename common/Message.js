"use strict";

const inquirer      = require('inquirer');
const CLI           = require('clui');
const Spinner       = CLI.Spinner;
const csv           = require('csv');
const fs            = require('fs');
const Logger        = require('./Logger');
const moment        = require('moment');

const Screen = require("./Print");
const Tools = require('./Tools');

class Message {

    constructor() {
    }

    _shouldDisplayOutput(options) {
        if (options && ("noOutput" in options)) {
            return !options.noOutput
        }

        return true;
    }

    log(message, value) {
        Logger.logs(message, value);
    }

    logError(message, value) {
        Logger.error(message, value);
    }

    welcome(options) {
        if(!this._shouldDisplayOutput(options)) {
            return;
        }

        this.log("options passed", options);

        Screen.print('');
        Screen.print('Welcome to '.white + 'Rainbow CLI'.rainbow);
    }

    version(v, options) {
        if(!this._shouldDisplayOutput(options)) {
            return;
        }

        Screen.print('Version ' + v.yellow);
    }

    action(command, param, options) {
        if(!this._shouldDisplayOutput(options)) {
            return;
        }

        if(param) {
            Screen.print("Request ".grey + command.white + " `".yellow + param.yellow + "'".yellow);
        }
        else {
            Screen.print("Request ".grey + command.white);
        }
    }

    out(json) {
        console.log(JSON.stringify(json));
    }

    outCSV(csv) {
        console.log(csv);
    }

    csv(file, json, isAlreadyCSV) {

        return new Promise((resolve, reject) => {

            if(isAlreadyCSV) {
                fs.writeFile(file, json, 'utf8', (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        Screen.success("Successfully saved to".white + " '".white + file.yellow + "'".white);
                        resolve();
                    }
                });
            }
            else {
                let stringify = csv.stringify;
                let writeStream = fs.createWriteStream(file, { flags : 'w' });
    
                stringify(json, {
                    formatters: {
                        date: function(value) {
                            return moment(value).format('YYYY-MM-DD');
                        }
                    },
                    delimiter: ";",
                    header: true
                }).pipe(writeStream);
                writeStream.on('close', function () {
                    Screen.success("Successfully saved".white + " " + json.length.toString().magenta + " user(s) to".white + " '".white + file.yellow + "'".white);
                    resolve();
                });
                writeStream.on('error', function (err) {
                    reject(err);
                });
            }
        });
    }

    lineFeed() {
        Screen.print('');
    }

    spin(options) {
        if(!this._shouldDisplayOutput(options)) {
            return;
        }
            
        let status = new Spinner('In progress, please wait...');
        status.start();
        return status;
    }

    unspin(spin) {
        if(spin) {
            spin.stop();
        }
    }

    tablePage(json, options) {
        if(!this._shouldDisplayOutput(options)) {
            return;
        }

        let page = Math.floor(json.offset / json.limit) + 1
        let totalPage = Math.floor(json.total / json.limit) + 1;
                        
        Screen.print('Displaying Page '.white + page.toString().yellow + " on ".white + totalPage.toString().yellow);
    }

    tableCompanies(json, options) {

        var array = [];

        array.push([ "#".gray, "Company name".gray, "Type".gray, "Visibility".gray, "Active".gray, "Organization".gray, "Identifier".gray]);
        array.push([ "-".gray, "------------".gray, "----".gray, "----------".gray, "------".gray, "-----------".gray, "----------".gray]);  

        for (var i = 0; i < json.companies.data.length; i++) {
            var company = json.companies.data[i];

            var visibility = "private".white;
            if(company.visibility === "public") {
                visibility = "public".yellow;
            }

            var offerType = "freemium".white;
            if(company.offerType === "premium") {
                offerType = "premium".yellow;
            }

            var active = "true".white;
            if(company.status !== "active") {
                active = "false".red;
            }

            var organisation = "".white;
            if(company.organisationId) {
                organisation = company.organisationId.yellow;
            }

            var number = (i+1);
            if(Number(options.page) > 0) {
                number = ((Number(options.page)-1) * json.companies.limit) + (i+1);
            }

            array.push([ number.toString().white, company.name.cyan, offerType, visibility, active ,organisation, company.id.white]); 
        }

        Screen.table(array);
        Screen.print('');
        Screen.success(json.companies.total + ' companies found.');
    }

    tableOrganizations(json, options) {
        var array = [];

        array.push([ "#".gray, "Organization name".gray, "Visibility".gray, "Identifier".gray]);
        array.push([ "-".gray, "-----------------".gray, "----------".gray, "----------".gray]);  

        for (var i = 0; i < json.data.length; i++) {
            var org = json.data[i];
            
            var visibility = "private".white;
            if(org.visibility === "public") {
                visibility = "public".yellow;
            }
            
            var number = (i+1);
            if(options.page > 0) {
                number = ((options.page-1) * json.limit) + (i+1);
            }

            array.push([ number.toString().white, org.name.cyan, visibility, org.id.white]); 
        }

        Screen.table(array);
        Screen.print('');
        Screen.success(json.total + ' organizations found.');
    }

    tablePhones(json, options) {
        var array = [];

        array.push([ "#".gray, "Short number".gray, "From System".gray, "Voice Mail number".gray, "Number".gray, "Monitored".gray, "ID".gray]);
        array.push([ "-".gray, "------------".gray, "-----------".gray, "-----------------".gray, "------".gray, "---------".gray, "--".gray]);  

        for (var i = 0; i < json.data.length; i++) {

            var phone = json.data[i];
            
            var number = (i+1);
            if(options.page > 0) {
                number = ((options.page-1) * json.limit) + (i+1);
            }

            var fromSystem = "No".white;
            if(phone.isFromSystem) {
                fromSystem = "Yes".yellow;
            }

            var isMonitored = "No".white;
            if(phone.isMonitored) {
                isMonitored = "True".yellow;
            }

            var longNumber = phone.numberE164 || phone.number || "";
            var vm = phone.voiceMailNumber || "";
            var sn = phone.shortNumber || "";

            array.push([ number.toString().white, sn.cyan, fromSystem, vm.white, longNumber.white, isMonitored, phone.id.white]); 
        }

        Screen.table(array);
        Screen.print('');
        Screen.success(json.total + ' systems found.');
    }

    tableSystems(json, options) {
        var array = [];

        array.push([ "#".gray, "System name".gray, "Version".gray, "Status".gray, "Type".gray, "ID".gray, "PBX ID".gray]);
        array.push([ "-".gray, "-----------".gray, "-------".gray, "------".gray, "----".gray, "--".gray, "------".gray]);  

        for (var i = 0; i < json.data.length; i++) {

            var system = json.data[i];

            var number = (i+1);
            if(options.page > 0) {
                number = ((options.page-1) * json.limit) + (i+1);
            }

            var type = system.type || "";
            var version = system.version || "";
            var name = system.name || ""
            var stats = system.status || "";
            if(stats !== "created") {
                stats = stats.yellow;
            }
            else {
                stats = stats.white;
            }
            var pbxId = system.pbxId.yellow || ""

            array.push([ number.toString().white, name.cyan, version.white, stats, type.white, system.id.white, pbxId]); 
        }

        Screen.table(array);
        Screen.print('');
        Screen.success(json.total + ' systems found.');
    }

    tableAPI(json, options) {
        var array = [];
        array.push([ "#".gray, "API".gray, "State".gray, "Version".gray]);
        array.push([ "-".gray, "---".gray, "-----".gray, "_______".gray]);  

        for(var i=0; i < json.length; i++) {

            let strVersion = "".white;
            let strState = "Not started".red;
            if(json[i].version !== "Not started") {
                strState = "Running".green;
                strVersion = json[i].version.yellow;
            }

            array.push([(i+1).toString().white, json[i].name.white,  strState, strVersion ]);
        }

        Screen.table(array);
        Screen.print('');
        Screen.success('status successfully executed.');
    }

    tablePlatform(json, options) {
        var array = [];
        array.push([ "#".gray, "Rainbow".gray, "Status".gray, "RTT".gray, "EventLoop".gray]);
        array.push([ "-".gray, "-------".gray, "------".gray, "---".gray, "---------".gray]);  

        for(var i=0; i < json.length; i++) {

            let eventLoop = json[i].eventloop;
            if(eventLoop === 0) {
                eventLoop = 5;
            }

            let rtt = json[i].rtt;
            let rttStr = rtt.toString() + " ms"; 
            let eventLoopStr =  eventLoop.toString() + " ms";

            array.push([(i+1).toString().white, json[i].name.white, json[i].status.cyan, rtt > 300 ? rttStr.red : rttStr.white, eventLoop > 300 ? eventLoopStr.red : eventLoopStr.white ]);
        }

        Screen.table(array);
        Screen.print('');
        Screen.success('status successfully executed.');
    }

    tableInvoiceCSV(json, options) {
        var invoice = json;
        Screen.print('');
        Screen.print(json);
        Screen.success('Invoice ' + options.path + 'retrieved');
    }

    tableInvoices(json, options) {

        var array = [];
        array.push([ "#".gray, "Company".gray, "Company ID".gray, "Type".gray, "Period".gray, "Initiated".gray, "Path".gray]);
        array.push([ "-".gray, "-------".gray, "----------".gray, "----".gray, "------".gray, "---------".gray, "----".gray]);
        
        var invoices = json;
        
        for(var i = 0; i < invoices.length; i++) {

            var companyId = invoices[i].companyId || "";
            var companyName = invoices[i].companyName || "";
            var period = invoices[i].billingPeriod || "";
            var type = invoices[i].invoiceType || "";
            var initiated = invoices[i].invoiceCreationDate || "";
            var path = invoices[i].filepath || "";
            var number = (i+1);

            array.push([ number.toString().white, companyName.cyan, companyId.white, type.magenta, period.white, initiated.white, path.white]);  
        }

        Screen.table(array);
        Screen.print('');
        
        if(options.companyId) {
            Screen.success(invoices.length + ' invoices found for company ' + options.companyId);
        } else {
            Screen.success(invoices.length + ' invoices found');
        }
    }

    tableApplications(json, options) {

        var array = [];
        array.push([ "#".gray, "Name".gray, "Type".gray, "Environment".gray, "State".gray, "OwnerId".gray, "Id".gray]);
        array.push([ "-".gray, "----".gray, "----".gray, "-----------".gray, "-----".gray, "-------".gray, "--".gray]);  

        var apps = json.data;

        let number = 0;

        apps.forEach((app) => {

            let name = app.name || "";

            let type = app.type || "";

            let env = app.env;
            if(env === "sandbox") {
                env = env.white;
            } else {
                env = env.yellow;
            }

            let state = app.state;
            if(state === "blocked" || state == "stopped") {
                state = state.red;
            } else {
                state = state.white;
            }

            let ownerId = app.ownerId || "";

            let id = app.id || "";

            array.push([(number+1).toString().white, name.white, type.cyan, env, state, ownerId.white, id.white]);

            number++;
        });

        Screen.table(array);
        Screen.print('');

        Screen.success(json.total + ' applications found');
    }

    tableMetrics(json, options) {

        let array = [];
        array.push([ "#".gray, "Period".gray, "Group".gray, "Value".gray]);
        array.push([ "-".gray, "------".gray, "-----".gray, "-----".gray]);  

        let metrics = json.data;

        let number = 0;

        metrics.forEach((metric) => {

            let groups = metric.groupCounters;
            let startDate = moment(metric.aggregationStartDate).format('lll');
            let subTotal = 0;
            let firstLine = true;

            groups.forEach( (group) => {
                if(firstLine) {
                    array.push([(number+1).toString().white, startDate.white, group.group.white, group.count.toString().cyan]);
                    firstLine = false;
                }
                else {
                    array.push(["", "", group.group.white, group.count.toString().cyan]);
                }
                subTotal += group.count;
            });
            array.push(["", "", "TOTAL".bgYellow, subTotal.toString().bgYellow]);
            number++;
        });

        Screen.table(array);
        Screen.print('');

        Screen.success(json.total + ' metrics found');
    }

    tableApns(json, options) {

        var array = [];
        array.push([ "#".gray, "OS".gray, "Type".gray, "Last Update".gray, "Id".gray]);
        array.push([ "-".gray, "--".gray, "----".gray, "-----------".gray, "--".gray]);  

        var apnsList = json.data;

        let number = 0;

        apnsList.forEach((apns) => {

            let os = apns.type === "apns" ? "IOS".cyan : "Android".magenta;

            let type = apns.type === "apns" ? apns.certificateType : apns.type;

            let id = apns.id || "";

            let lastUpdate = apns.lastUpdateDate ? apns.lastUptadeDate : apns.dateOfCreation;

            let lastUpdateStr = moment(lastUpdate).format("lll");

            array.push([(number+1).toString().white, os, type.white, lastUpdateStr.white, id.yellow]);

            number++;
        });

        Screen.table(array);
        Screen.print('');

        Screen.success(apnsList.length + ' push notification settings found');
    }

    tableUsers(json, options) {

        var array = [];
        array.push([ "#".gray, "Name".gray, "LoginEmail".gray, "Company".gray, "Account".gray, "Roles".gray, "Active".gray, "ID".gray]);
        array.push([ "-".gray, "----".gray, "----------".gray, "-------".gray, "-------".gray, "-----".gray, "------".gray, "--".gray]);  

        var users = json.data;

        var companyId = "";

        for(var i = 0; i < users.length; i++) {

            if(options.company || options.companyId) {
                companyId = users[i].companyId;
            }

            var accountType = users[i].accountType;
            if(accountType === "free") {
                accountType = accountType.white;
            }
            else {
                accountType = accountType.yellow;
            }

            var roles = users[i].roles.join();

            var active = "true".white;
            if(!users[i].isActive) {
                active = "false".yellow;
            }

            var name = "";
            name = users[i].displayName;
            if(!name) {
                name = users[i].firstName + " " +users[i].lastName;
            }

            var number = (i+1);
            if(options.page > 0) {
                number = ((options.page-1) * json.limit) + (i+1);
            }

            var companyName = users[i].companyName || "";

            array.push([ number.toString().white, name.cyan, users[i].loginEmail.white, companyName.white, accountType, roles.white, active, users[i].id.white]);  
        }

        Screen.table(array);
        Screen.print('');

        if(options.company) {
            Screen.success(json.total + ' users found in company ' + options.company);
        } else if(options.companyId) {
            Screen.success(json.total + ' users found in company ' + options.companyId);
        } else {
            Screen.success(json.total + ' users found');
        }
    }

    tableSites(json, options) {

        var array = [];

        array.push([ "#".gray, "Site name".gray, "Status".gray, "ID".gray, "Company ID".gray]);
        array.push([ "-".gray, "---------".gray, "------".gray, "--".gray]);  

        for (var i = 0; i < json.data.length; i++) {
            var site = json.data[i];

            var active = "true".white;
            if(site.status !== "active") {
                active = "false".red;
            }
            
            var number = (i+1);
            if(options.page > 0) {
                number = ((options.page-1) * json.limit) + (i+1);
            }

            array.push([ number.toString().white, site.name.cyan, active, site.id.white, site.companyId.white]); 
        }

        Screen.table(array);
        Screen.print('');
        Screen.success(json.total + ' sites found.');
    }

    tableOffers(json, options) {
        
        var array = [];

        array.push([ "#".gray, "Name".gray, "Business Model".gray, "Can be sold".gray, "Profile Id".gray, "ID".gray, "Description".gray]);
        array.push([ "-".gray, "----".gray, "--------------".gray, "-----------".gray, "-----------".gray, "--".gray, , "-----------".gray]);  

        for (var i = 0; i < json.data.length; i++) {
            var offer = json.data[i];

            var canBeSold = "false".white;
            if(offer.canBeSold) {
                canBeSold = "true".yellow;
            }

            var business = "";
            if( offer.businessModel) {
                business = offer.businessModel;
            }
            
            var number = (i+1);
            if(options.page > 0) {
                number = ((options.page-1) * json.limit) + (i+1);
            }

            array.push([ number.toString().white, offer.name.cyan, business.white, canBeSold, offer.profileId.white, offer.id.white, offer.description.white]); 
        }

        Screen.table(array);
        Screen.print('');
        Screen.success(json.total + ' offers found.');
    }

    tableCatalogs(json, options, offers) {
        
        var array = [];

        array.push([ "#".gray, "Name".gray, "ID".gray, "Offer Id".gray, "Offer name".gray]);
        array.push([ "-".gray, "----".gray, "--".gray, "--------".gray, "-----------".gray]);  

        for (var i = 0; i < json.data.length; i++) {
            var catalog = json.data[i];

            var number = (i+1);
            if(options.page > 0) {
                number = ((options.page-1) * json.limit) + (i+1);
            }

            var nbOffer = catalog.offersList.length;
            var offer = "";
            if(nbOffer === 0) {
                offer = "No offers".red;
            }
            else if(nbOffer == 1) {
                offer = "1 offer".green;
            } else {
                offer = nbOffer.toString().yellow + " offers".yellow;
            }

            var details = "";
            if(nbOffer > 0) {
                details = "";
            }

            array.push([ number.toString().white, catalog.name.cyan, catalog.id.white, offer, details]); 

            catalog.offersList.forEach((offerId) => {

                var offer = offers.find((offerItem) => {
                    return offerItem.id === offerId;
                });

                if(offer) {
                    array.push([ " ".white, " ".cyan, " ".white, offerId.white, offer.name]); 
                } else {

                }

            });
            
            
        }

        Screen.table(array);
        Screen.print('');
        Screen.success(json.total + ' catalogs found.');
    }

    table2D(json) {

        var array = [];
        array.push([ "#".gray, "Attribute".gray, "Content".gray]);
        array.push([ "-".gray, "---------".gray, "-------".gray]);  
        var index = 1;
        for (var key in json) {
            var data = json[key];
            array.push([ index.toString().white, key.toString().cyan, JSON.stringify(data).white]);
            index+=1;
        }

        Screen.table2D(array);
    }

    tableImports(json, options) {

        var array = [];

        array.push([ "#".gray, "Request".gray, "Status".gray, "Success".gray, "Warning".gray, "Failed".gray, "Company".gray, "From".gray, "Date".gray]);
        array.push([ "-".gray, "-------".gray, "------".gray, "-------".gray, "-------".gray, "------".gray, "-------".gray, "----".gray, "----".gray]);  

        for (var i = 0; i < json.length; i++) {
            let imports = json[i];
            var number = (i+1).toString();
            let request = imports.reqId.toString() || "";
            let status = imports.status || "";
            let success = imports.counters.succeeded.toString() || "-";
            let failed = imports.counters.failed.toString() || "-";
            let warning = imports.counters.warnings.toString() || "-";
            let company = imports.companyId || "";
            let from = imports.userId || "";
            let date = imports.startTime.toString() || "";

            array.push([ number.white, request.white, status.yellow, success.green, failed.red, warning.red, company.white, from.white, date.white ]); 
        }

        Screen.table(array);
        Screen.print('');
        Screen.success(json.length + ' import(s) found.');
    }

    tableCommands(json, options) {
        
        var array = [];

        array.push([ "Level".gray, "Theme".gray, "Commands".gray, "Details".gray]);
        array.push([ "-----".gray, "-----".gray, "--------".gray, "-------".gray]);  

        var previousLevel = "";
        var previousTheme = "";

        for (var i = 0; i < json.data.length; i++) {
            var command = json.data[i];

            var active = "true".white;

            var level = command.level !== previousLevel ? command.level : "";
            previousLevel = command.level;

            var theme = command.theme !== previousTheme ? command.theme : "";
            previousTheme = command.theme;
            
            if(theme === "----------") {
                array.push([ level.gray, theme.gray, command.command.gray, command.details.gray]); 
            } else {
                array.push([ level.cyan, theme.white, command.command.yellow, command.details.white]); 
            }
        }

        Screen.table(array);
        Screen.print('');
        Screen.success('Avallable commands for your level listed.');
    }

    loggedin(prefs, options) {

        let user = prefs.user;
        let host = prefs.host;

        if(!this._shouldDisplayOutput(options)) {
            return;
        }

        let email = "???";
        let roles = "???";
        let level = "???";
        let adminType = "";
        if( user && user.loginEmail) {
            email = user.loginEmail;
        }
        if(user && user.roles) {
            roles = user.roles.join(' + ');
        }

        Screen.print('You are logged in as'.grey + " " + email.yellow + " on platform ".grey + host.yellow);
        Screen.print('Your roles'.grey + " " + roles.magenta);

        if(user && user.roles) {
            if(user.roles.includes("user")) {
                if(adminType.length === 0) {
                    adminType = "user";
                }
            }
    
            if(user.roles.includes("app_admin")) {
                if(adminType.length > 0) {
                    adminType = "app_admin > " + adminType;
                }
                else {
                    adminType = "app_admin > user";
                }
            }
    
            if(user.roles.includes("app_superadmin")) {
                if(adminType.length > 0) {
                    adminType = "app_superadmin > " + adminType;
                }
                else {
                    adminType = "app_superadmin > app_admin > user";
                }
            }
    
            switch (user.adminType) {
                case "company_admin":
                    adminType = "company_admin" + " > " + adminType;
                    break;
                case "organization_admin":
                    adminType = "organization_admin" + " > " + adminType;
                    break;
            }
    
            if(user.roles.includes("bp_admin")) {
                if(adminType.length > 0) {
                    adminType = "bp_admin > " + adminType;
                }
                else {
                    adminType = "bp_admin > organization_admin (*) > company_admin > user";
                }
            }
    
            if(user.roles.includes("superadmin")) {
                if(adminType.length > 0) {
                    adminType = "superadmin > " + adminType;
                }
                else {
                    adminType = "superadmin > organization_admin (*) > company_admin > user";
                }
            }
        }

        Screen.print('Your level'.grey + " "  + adminType.cyan);
        
        Screen.print('');
    }

    notLoggedIn(options) {
        if(!this._shouldDisplayOutput(options)) {
            return;
        }

        Screen.error('Please, you have to log-in before executing other commands');
    }

    success(options) {
        if(!this._shouldDisplayOutput(options)) {
            return;
        }

        Screen.success('Command successfully completed');
    }

    print(text, options) {
        if(!this._shouldDisplayOutput(options)) {
            return;
        }

        Screen.print(text.white);
    }

    printSuccess(text, value, options) {
        if(!this._shouldDisplayOutput(options)) {
            return;
        }

        Screen.print(text.white + " '".cyan + value.toString().cyan + "'".cyan);
    }

    canceled(options) {
        if(!this._shouldDisplayOutput(options)) {
            return;
        }

        Screen.print('Your command has been canceled');
        Screen.print('');
    }

    notFound() {
        Screen.error("Command not found");
        Screen.print("Type `rbw --help` for the list of available commands");
    }

    found(number, type, options) {
         if(!this._shouldDisplayOutput(options)) {
            return;
        }
        Screen.print('');
        Screen.print(number.toString().yellow + " " + type.yellow + " match".white);
    }

    warn(text, value, options) {
        if(!this._shouldDisplayOutput(options)) {
            return;
        }

        Screen.print("Warning, ".red + text.white  + " '".cyan + value.cyan + "'".cyan);
    }

    errorList(err, options, itemId) {
        if(!this._shouldDisplayOutput(options)) {
            var out = new Buffer.from(JSON.stringify(err));
            process.stdout.write(out);
            process.stdout.write("\r\n");
            return;
        }

        let msg = "Can't execute the command for ".white + itemId.red;
        msg += " - ".gray + err.msg.gray + '/'.gray + err.code.toString().gray;

        Screen.error(msg);
    }

    error(err, options) {
        if(!this._shouldDisplayOutput(options)) {
            var out = new Buffer.from(JSON.stringify(err));
            process.stdout.write(out);
            process.stdout.write("\r\n");
            return;
        }

        Screen.print('');
        Screen.error("Can't execute the command".white);
        if(!err) {
            Screen.print("  No additional information");
        }
        else {
            if(err.details) {

                let msg = err.details.msg || "-";
                let code = err.details.code || "-";

                if(typeof err.details === "string") {
                    Screen.print("  " + err.details.white);
                }
                else if (Tools.isObject(err.details)) {
                    let details = err.details.details || err.msg || "Bad request";
                    Screen.print("  " + details.white + ' ('.gray + msg.gray + '/'.gray + code.toString().gray + ')'.gray);
                }
                else {
                    err.details.forEach(function(detail) {
                        Screen.print("  " + "Incorrect value for ".white + detail.param.yellow + ' ('.gray + detail.msg.gray + ')'.gray);
                    });
                }
            }
            else {
                if(err.msg && err.code) {
                    Screen.print("  (".gray + err.msg.gray + '/'.gray + err.code.toString().gray + ')'.gray);
                }
                else {
                    Screen.print("  No additional information");
                }
                
            }
        }
        Screen.print('');
    }

    choices(message, choices) {
        return new Promise(function(resolve) {

            var question = {
                type: 'list',
                message: message,
                choices: choices,
                name: 'confirmation'
            };

            inquirer.prompt([question]).then(function (answer) {
                resolve(answer.confirmation);        
            });

        });
    }

    confirm(message) {
        return new Promise(function(resolve) {

            var question = {
                type: 'list',
                message: message,
                choices: [{name: 'Yes', value:true}, {name: 'Damned!, forget my command...', value: false}],
                name: 'confirmation'
            };

            inquirer.prompt([question]).then(function (answer) {
                resolve(answer.confirmation);        
            });

        });
    }

    ask(message, name) {
        return new Promise(function(resolve) {

            var question = {
                type: 'input',
                message: message,
                name: 'query'
            };

            inquirer.prompt([question]).then(function (answer) {
                resolve(answer.query);
            });

        });
    }

    askPassword(message, name) {
        return new Promise(function(resolve) {

            var question = {
                type: 'password',
                message: message,
                name: 'query',
                default: 'Password_123'
            };

            inquirer.prompt([question]).then(function (answer) {
                resolve(answer.query);
            });

        });
    }
}

module.exports = new Message();