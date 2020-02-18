"use strict";

const NodeSDK = require("../common/SDK");
const Message = require("../common/Message");
const Exit = require("../common/Exit");

class CChannels {
    constructor(prefs) {
        this._prefs = prefs;
    }

    _browseChannels(token, options) {
        return new Promise(function(resolve, reject) {
            var filterToApply = "sortField=name";
            
            if (options.sortbyname) {
                filterToApply = "sortField=name";
            }
            if (options.sortbytopic) {
                filterToApply = "sortField=topic";
            }
            if (options.sortbysubscount) {
                filterToApply = "sortField=subscribers_count";
            }
            if (options.sortbycreationdate) {
                filterToApply = "sortField=creationDate";
            }
            
            if (options.reverse) {
                filterToApply += "&sortOrder=-1"; // default is -1 (descending)
            } else {
                filterToApply += "&sortOrder=1";
            }

            if (options.category) {
                filterToApply += "&category=" + options.category;
            }
            if (options.excludedCategory) {
                filterToApply += "&excluded_category=" + options.excludedCategory;
            }
            if (options.subscribed) {
                filterToApply += "&subscribed=true";
            }
            if (options.unsubscribed) {
                filterToApply += "&subscribed=false";
            }
            if (options.page > 0) {
                filterToApply += "&offset=";
                if (options.page > 1) {
                    filterToApply += options.limit * (options.page - 1);
                } else {
                    filterToApply += 0;
                }
            }

            filterToApply += "&limit=" + Math.min(options.limit, 1000);

            console.log(filterToApply);
            NodeSDK.get("/api/rainbow/channels/v1.0/channels/browse?" + filterToApply, token)
            .then(function(json) {
                resolve(json);
            })
            .catch(function(err) {
                reject(err);
            });
        });
    }

    _getChannel(token, id) {
        return new Promise(function(resolve, reject) {
            NodeSDK.get("/api/rainbow/channels/v1.0/channels/" + id, token)
                .then(function(json) {
                    resolve(json);
                })
                .catch(function(err) {
                    reject(err);
                });
        });
    }

    _getChannelUsers(token, id) {
        return new Promise(function(resolve, reject) {
            NodeSDK.get("/api/rainbow/channels/v1.0/channels/" + id + "/users", token)
                .then(function(json) {
                    resolve(json);
                })
                .catch(function(err) {
                    reject(err);
                });
        });
    }

    _searchChannel(token, options) {
        return new Promise(function(resolve, reject) {
            var filterToApply = "sortField=name";
            
            if (options.sortbyname) {
                filterToApply = "sortField=name";
            }
            if (options.sortbytopic) {
                filterToApply = "sortField=topic";
            }
            if (options.sortbysubscount) {
                filterToApply = "sortField=subscribers_count";
            }
            if (options.sortbycreationdate) {
                filterToApply = "sortField=creationDate";
            }
            
            if (options.reverse) {
                filterToApply += "&sortOrder=-1"; // default is -1 (descending)
            } else {
                filterToApply += "&sortOrder=1";
            }

            if (options.name) {
                filterToApply += "&name=" + encodeURIComponent(options.name);
            }
            if (options.topic) {
                filterToApply += "&topic=" + encodeURIComponent(options.topic);
            }
            if (options.category) {
                filterToApply += "&category=" + encodeURIComponent(options.category);
            }
            if (options.excludedCategory) {
                filterToApply += "&excluded_category=" + encodeURIComponent(options.excludedCategory);
            }
            if (options.subscribed) {
                filterToApply += "&subscribed=true";
            }
            if (options.unsubscribed) {
                filterToApply += "&subscribed=false";
            }
            if (options.page > 0) {
                filterToApply += "&offset=";
                if (options.page > 1) {
                    filterToApply += options.limit * (options.page - 1);
                } else {
                    filterToApply += 0;
                }
            }

            filterToApply += "&limit=" + Math.min(options.limit, 1000);

            NodeSDK.get("/api/rainbow/channels/v1.0/channels/search?" + filterToApply, token)
            .then(function(json) {
                resolve(json);
            })
            .catch(function(err) {
                reject(err);
            });
        });
    }

    browseChannels(options) {
        var that = this;

        Message.welcome(options);

        if (this._prefs.token && this._prefs.user) {
            Message.loggedin(this._prefs, options);

            let spin = Message.spin(options);
            NodeSDK.start(
                this._prefs.email,
                this._prefs.password,
                this._prefs.host,
                this._prefs.proxy,
                this._prefs.appid,
                this._prefs.appsecret
            )
            .then(function() {
                Message.log("execute action...");
                return that._browseChannels(that._prefs.token, options);
            })
            .then(function(json) {
                Message.unspin(spin);
                Message.log("action done...", json);

                if (options.noOutput) {
                    Message.out(json);
                } else {
                    if (json.total > json.limit) {
                        Message.tablePage(json, options);
                    }
                    Message.lineFeed();
                    Message.tableChannels(json, options);
                }

                Message.log("finished!");
            })
            .catch(function(err) {
               Message.unspin(spin);
               Message.error(err, options);
               Exit.error();
            });
        } else {
            Message.notLoggedIn(options);
            Exit.error();
        }
    }

    getChannel(id, options) {
        var that = this;

        Message.welcome(options);

        if (this._prefs.token && this._prefs.user) {
            Message.loggedin(this._prefs, options);
            Message.action("Get information for channel ", id, options);

            let spin = Message.spin(options);
            NodeSDK.start(
                this._prefs.email,
                this._prefs.password,
                this._prefs.host,
                this._prefs.proxy,
                this._prefs.appid,
                this._prefs.appsecret
            )
            .then(function() {
                Message.log("execute action...");
                return that._getChannel(that._prefs.token, id);
            })
            .then(function(json) {
                Message.unspin(spin);
                Message.log("action done...", json);

                if (options.noOutput) {
                    Message.out(json.data);
                } else {
                    Message.lineFeed();
                    Message.table2D(json.data);
                    Message.lineFeed();
                    Message.success(options);
                }
                Message.log("finished!");
            })
            .catch(function(err) {
                Message.unspin(spin);
                Message.error(err, options);
                Exit.error();
            });
        } else {
            Message.notLoggedIn(options);
            Exit.error();
        }
    }

    getChannelUsers(id, options) {
        var that = this;

        Message.welcome(options);

        if (this._prefs.token && this._prefs.user) {
            Message.loggedin(this._prefs, options);
            Message.action("Get users that subscribed to channel ", id, options);

            let spin = Message.spin(options);
            NodeSDK.start(
                this._prefs.email,
                this._prefs.password,
                this._prefs.host,
                this._prefs.proxy,
                this._prefs.appid,
                this._prefs.appsecret
            )
            .then(function() {
                Message.log("execute action...");
                return that._getChannelUsers(that._prefs.token, id);
            })
            .then(function(json) {
                Message.unspin(spin);
                Message.log("action done...", json);

                if (options.noOutput) {
                    Message.out(json.data);
                } else {
                    if (json.total > json.limit) {
                        Message.tablePage(json, options);
                    }

                    Message.lineFeed();
                    Message.tableChannelUsers(json, options);
                    Message.lineFeed();
                    Message.success(options);
                }
                Message.log("finished!");
            })
            .catch(function(err) {
                Message.unspin(spin);
                Message.error(err, options);
                Exit.error();
            });
        } else {
            Message.notLoggedIn(options);
            Exit.error();
        }
    }

    searchChannel(options) {
        var that = this;

        Message.welcome(options);

        if (this._prefs.token && this._prefs.user) {
            Message.loggedin(this._prefs, options);

            let spin = Message.spin(options);
            NodeSDK.start(
                this._prefs.email,
                this._prefs.password,
                this._prefs.host,
                this._prefs.proxy,
                this._prefs.appid,
                this._prefs.appsecret
            )
            .then(function() {
                Message.log("execute action...");
                return that._searchChannel(that._prefs.token, options);
            })
            .then(function(json) {
                Message.unspin(spin);
                Message.log("action done...", json);

                if (options.noOutput) {
                    Message.out(json);
                } else {
                    if (json.total > json.limit) {
                        Message.tablePage(json, options);
                    }
                    Message.lineFeed();
                    Message.tableChannels(json, options);
                }

                Message.log("finished!");
            })
            .catch(function(err) {
               Message.unspin(spin);
               Message.error(err, options);
               Exit.error();
            });
        } else {
            Message.notLoggedIn(options);
            Exit.error();
        }
    }
}

module.exports = CChannels;