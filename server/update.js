var router = function(req, res) {
    if (require("./debug.js").debug) {
        res.sendFile(__dirname + "/debug/update");
    } else {
        var request = require("request");
        var x2j = require("xml2js");

        var feedsStr = req.query.feeds;
        var feeds = JSON.parse(feedsStr);

        var feedContents = {};
        var updatedCount;

        function checkUpdatedCount() {
            if (updatedCount === feeds.length) {
                res.send(JSON.stringify(feedContents));
            }
        }

        console.log("starting feeds update");
        updatedCount = 0;

        if (feeds.length > 0) {
            feeds.forEach(function(feed) {
                console.log("starting update of feed '" + feed.title +  "'");
                request({
                    url: feed.url,
                    headers: require("./REQUEST_HEADERS.js").REQUEST_HEADERS
                }, function(err, result, body) {
                    if (!err) {
                        x2j.parseString(body, function(err, result) {
                            if (!err) {
                                // console.dir(result.rss.channel[0].item);
                                var items = result.rss.channel[0].item;

                                feedContents[feed.url] = { items: [] };
                                var feedContent = feedContents[feed.url];

                                [].slice.call(items).forEach(function(item) {
                                    var itemURL = null;
                                    if (item.enclosure && item.enclosure[0].$ && item.enclosure[0].$.url) {
                                        itemURL = item.enclosure[0].$.url;
                                    } else if (item.link) {
                                        itemURL = (typeof item.link === "string" ? item.link : item.link._);
                                    }

                                    var itemDescription = null;
                                    if (item.description) {
                                        itemDescription = item.description[0];
                                    }

                                    feedContent.items.push({
                                        title: item.title[0],
                                        date: (item.pubDate ? item.pubDate[0] : null),
                                        url: itemURL,
                                        description: itemDescription
                                    });
                                });

                                updatedCount += 1;
                                checkUpdatedCount();
                                console.log("done updating feed '" + feed.title +  "'");
                            } else {
                                console.log(err);
                            }
                        });
                    } else {
                        console.log("error updating feed '" + feed.title + "'");
                        console.dir(err || result.status);
                    }
                });
            });
        } else {
            console.log("no feeds to update");
        }
    }
};

module.exports.router = router;
