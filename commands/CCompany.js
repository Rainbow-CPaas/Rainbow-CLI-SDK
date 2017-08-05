"use strict";

const NodeSDK = require('../common/SDK');
const Message = require('../common/Message');
const Exit = require('../common/Exit');

const CFree = require('./CFree');

class CCompany {

    constructor(prefs) {
        this._prefs = prefs;
        this._free = new CFree(this._prefs);
    }

    _getListOfCompanies(token, options) {

        return new Promise(function(resolve, reject) {

            var filterToApply = "";

            if(options.bp) {
                filterToApply += "&isBP=true";
            }

            if(options.name) {
                filterToApply += "&name=" + options.name;
            }

            NodeSDK.get('/api/rainbow/admin/v1.0/organisations?format=small&limit=1000', token).then(function(jsonO) {
                var organisations = jsonO;

                var offset = "";
                if(options.page > 0) {
                    offset = "&offset=";
                    if(options.page > 1) {
                        offset += (options.limit * (options.page - 1));
                    }
                    else {
                        offset +=0;
                    }
                }

                var limit = "&limit=" + Math.min(options.limit, 1000);

                if(options.org) {
                    NodeSDK.get('/api/rainbow/admin/v1.0/organisations/' + options.org + '/companies?format=full' + filterToApply + offset + limit, token).then(function(jsonC) {
                        var companies = jsonC;
                        resolve({organisations: organisations, companies: companies});
                    }).catch(function(err) {
                        reject(err);
                    });
                } else {
                    NodeSDK.get('/api/rainbow/admin/v1.0/companies?format=full' + filterToApply + offset + limit, token).then(function(jsonC) {
                        var companies = jsonC;
                        resolve({organisations: organisations, companies: companies});
                    }).catch(function(err) {
                        reject(err);
                    });
                }

                
            }).catch(function(err) {
                reject(err);
            });
        });
    }

    _createCompany(token, name) {

        return new Promise(function(resolve, reject) {

            NodeSDK.post('/api/rainbow/admin/v1.0/companies', token, {name: name}).then(function(json) {
                resolve(json);
            }).catch(function(err) {
                reject(err);
            });
        });
    }

    _getCompany(token, id) {

        return new Promise(function(resolve, reject) {

            NodeSDK.get('/api/rainbow/admin/v1.0/companies/' + id, token).then(function(json) {
                resolve(json);
            }).catch(function(err) {
                reject(err);
            });
        });
    }

    _deleteCompany(token, id, options) {

        var that = this;

        return new Promise(function(resolve, reject) {

            if(options.force) {

                that._free._removeAllUsersFromACompany(token, id).then(function() {
                    NodeSDK.delete('/api/rainbow/admin/v1.0/companies/' + id, token).then(function(json) {
                        resolve(json);
                    }).catch(function(err) {
                        reject(err);
                    });
                }).catch(function(err) {
                    reject(err)
                });
            }
            else {
                that._getCompany(token, id).then(function(company) {
                
                    if(company.data.numberUsers > 0) {
                        reject({
                            code: 401,
                            msg: 'At least one user exists in that company',
                            details: ''
                        });
                    }
                    else {
                        NodeSDK.delete('/api/rainbow/admin/v1.0/companies/' + id, token).then(function(json) {
                            resolve(json);
                        }).catch(function(err) {
                            reject(err);
                        });
                    }
                }).catch(function(err){
                    reject(err);
                });
            }
            
        });
    }

    _linkCompany(token, id, orgid) {

        var that = this;

        return new Promise(function(resolve, reject) {

            NodeSDK.post('/api/rainbow/admin/v1.0/organisations/' + orgid + '/companies', token, {companyId: id}).then(function(json) {
                resolve(json);
            }).catch(function(err) {
                reject(err);
            });
            resolve();
        });
    }

    _unlinkCompany(token, id) {

        var that = this;

        return new Promise(function(resolve, reject) {

            that._getCompany(token, id).then(function(company) {

                var organisationId = company.data.organisationId;
                
                NodeSDK.delete('/api/rainbow/admin/v1.0/organisations/' + organisationId + '/companies/' + id, token).then(function(json) {
                    resolve(json);
                }).catch(function(err) {
                    reject(err);
                });
            }).catch(function(err){
                reject(err);
            });
        });
    }

    getCompanies(options) {
        var that = this;

        Message.welcome(options);
        
        if(this._prefs.token && this._prefs.user) {
            Message.loggedin(this._prefs.user, options);

            if(!options.csv) {
                Message.action("List Companies:", null, options);
            }

            let spin = Message.spin(options);
            NodeSDK.start(this._prefs.email, this._prefs.password, this._prefs.host).then(function() {
                return that._getListOfCompanies(that._prefs.token, options);
            }).then(function(json) {

                Message.unspin(spin);
                
                if(options.csv) {
                    Message.csv(options.csv, json.companies.data).then(() => {
                    }).catch((err) => {
                        Exit.error();
                    });
                }
                else if(options.noOutput) {
                    Message.out(json.companies.data);
                }
                else {

                    if(json.companies.total > json.companies.limit) {
                        Message.tablePage(json.companies, options);
                    }
                    Message.lineFeed();
                    Message.tableCompanies(json, options);
                }

            }).catch(function(err) {
                Message.unspin(spin);
                Message.error(err, options);
                Exit.error();
            });
        }
        else {
            Message.notLoggedIn(options);
            Exit.error();
        }
    }

    createCompany(name, options) {
        var that = this;

        Message.welcome(options);
            
        if(this._prefs.token && this._prefs.user) {
            Message.loggedin(this._prefs.user, options);
        
            Message.action("Create new company", name, options);
            let spin = Message.spin(options);

            NodeSDK.start(this._prefs.email, this._prefs.password, this._prefs.host).then(function() {
                return that._createCompany(that._prefs.token, name);
            }).then(function(json) {
                Message.unspin(spin);

                if(options.noOutput) {
                    Message.out(json.data);
                }
                else {
                    Message.lineFeed();
                    Message.printSuccess('Company created with Id', json.data.id, options);    
                    Message.success(options);
                }
            }).catch(function(err) {
                Message.unspin(spin);
                Message.error(err, options);
                Exit.error();
            });
        }
        else {
            Message.notLoggedIn(options);
            Exit.error();
        }
    }

    deleteCompany(id, options) {
        var that = this;

        var doDelete = function(id) {
            Message.action("Delete company", id, options);

            let spin = Message.spin(options);
            NodeSDK.start(that._prefs.email, that._prefs.password, that._prefs.host).then(function() {
                return that._deleteCompany(that._prefs.token, id, options);
            }).then(function(json) {
                Message.unspin(spin);
                Message.lineFeed();
                Message.success(options);
            }).catch(function(err) {
                Message.unspin(spin);
                Message.error(err, options);
                Exit.error();
            });
        }

        Message.welcome(options);
            
        if(this._prefs.token && this._prefs.user) {
           Message.loggedin(this._prefs.user, options);

            if(options.noconfirmation) {
                doDelete(id);
            }
            else {
                Message.confirm('Are-you sure ? It will remote it completely').then(function(confirm) {
                    if(confirm) {
                        doDelete(id);
                    }
                    else {
                        Message.canceled(options);
                        Exit.error();
                    }
                });
            }
        }
        else {
            Message.notLoggedIn(options);
            Exit.error();
        }
    }

    linkCompany(id, orgid, options) {
        var that = this;

        Message.welcome(options);
            
        if(this._prefs.token && this._prefs.user) {
           Message.loggedin(this._prefs.user, options);
        
            Message.action("Link company",id, options);

            let spin = Message.spin(options);
            NodeSDK.start(this._prefs.email, this._prefs.password, this._prefs.host).then(function() {
                return that._linkCompany(that._prefs.token, id, orgid);
            }).then(function(json) {
                Message.unspin(spin);
                Message.lineFeed();
                Message.success(options);
            }).catch(function(err) {
                Message.unspin(spin);
                Message.error(err, options);
                Exit.error();
            });
        }
        else {
            Message.notLoggedIn(options);
            Exit.error();
        }
    }

    unlinkCompany(id, options) {
        var that = this;

        Message.welcome(options);
            
        if(this._prefs.token && this._prefs.user) {
           Message.loggedin(this._prefs.user, options);
        
            Message.action("Unlink company", id, options);
           
            let spin = Message.spin(options);
            NodeSDK.start(this._prefs.email, this._prefs.password, this._prefs.host).then(function() {
                return that._unlinkCompany(that._prefs.token, id);
            }).then(function(json) {
                Message.unspin(spin);
                Message.lineFeed();
                Message.success(options);
            }).catch(function(err) {
                Message.unspin(spin);
                Message.error(err, options);
                Exit.error();
            });
        }
        else {
            Message.notLoggedIn(options);
            Exit.error();
        }
    }

    getCompany(id, options) {
        var that = this;

        Message.welcome(options);
            
        if(this._prefs.token && this._prefs.user) {
            Message.loggedin(this._prefs.user, options);
        
            Message.action("Get information for company", id, options);
            
            let spin = Message.spin(options);
            NodeSDK.start(this._prefs.email, this._prefs.password, this._prefs.host).then(function() {
                return that._getCompany(that._prefs.token, id);
            }).then(function(json) {

                Message.unspin(spin);

                if(options.noOutput) {
                    Message.out(json.data);
                }
                else {
                    Message.lineFeed();
                    Message.table2D(json.data);
                    Message.lineFeed();
                    Message.success(options);
                }
            }).catch(function(err) {
                Message.unspin(spin);
                Message.error(err, options);
                Exit.error();
            });
        }
        else {
            Message.notLoggedIn(options);
            Exit.error();
        }
    }
}

module.exports = CCompany;