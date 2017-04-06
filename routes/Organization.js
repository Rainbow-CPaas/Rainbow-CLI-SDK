"use strict";

var COrganization = require('../commands/COrganization');

class Organization {

    constructor(program, prefs) {
        this._program = program;
        this._prefs = prefs;
        this._organization = new COrganization(this._prefs);
    }

    start() {
        this.listOfCommands()
    }

    stop() {

    }
    listOfCommands() {
        var that = this;

        this._program.command('org', '<id>')
        .description("Retrieve information about an existing organization")
        .action(function (id) {
            that._organization.getOrganization(id);
        });

        this._program.command('create org', '<name>')
        .description("Create a new organization")
        .option('-p, --public', 'Create a public organization')
        .action(function (name, commands) {

            var options = {
                public: commands.public || false
            };

            that._organization.createOrganization(name, options);
        });

        this._program.command('delete org', '<id>')
        .description("Delete an existing organization")
        .option('--nc', 'Do not ask confirmation')
        .action(function (id, commands) {

            var options = {
                noconfirmation: commands.nc || false
            };

            that._organization.deleteOrganization(id, options);
        });

        this._program.command('orgs')
        .description("List all existing organizations")
        .option('-p, --page <number>', 'Display a specific page')
        .option('-m, --max', 'Display up to max result per page (max=1000)')
        .option('-f, --file <filename>', 'Print result to a file in CSV')
        .action(function (commands) {

            var options = {
                csv: "",
            };

            if(typeof commands === "object") {

                var page = 0;
                if("page" in commands) {
                    if(commands.page > 1) {
                        page = commands.page;
                    }
                }
            
                if("max" in commands && commands.max) {
                    page = -1
                }

                options = {
                    page: page,
                    csv: commands.file || "",
                };
            }

            that._organization.getOrganizations(options);
        });
    }
}

module.exports = Organization;