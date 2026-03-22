import { useState, useEffect, useCallback } from "react";

const DEFAULT_CONFIG = {
  feeds: {
    general: [
      { name: "Houston Chronicle", url: "https://www.houstonchronicle.com/rss/feed/Top-News-238.php", active: true },
      { name: "Reuters Top News", url: "https://feeds.reuters.com/reuters/topNews", active: true },
      { name: "BBC World", url: "https://feeds.bbci.co.uk/news/world/rss.xml", active: true },
      { name: "TechCrunch", url: "https://techcrunch.com/feed/", active: true },
      { name: "AP News", url: "https://rsshub.app/ap/topics/apf-topnews", active: true },
      { name: "The Verge", url: "https://www.theverge.com/rss/index.xml", active: true },
      { name: "Houston Business Journal", url: "https://www.bizjournals.com/houston/feed/latest/", active: true },
      { name: "Wired", url: "https://www.wired.com/feed/rss", active: true },
      { name: "Fox News", url: "https://moxie.foxnews.com/google-publisher/latest.xml", active: true },
      { name: "CNN", url: "http://rss.cnn.com/rss/cnn_topstories.rss", active: true },
      { name: "CNBC", url: "https://www.cnbc.com/id/100003114/device/rss/rss.html", active: true },
      { name: "The Daily Wire", url: "https://www.dailywire.com/feeds/rss.xml", active: true },
    ],
    sports: [
      { name: "ESPN Top Headlines", url: "https://www.espn.com/espn/rss/news", active: true },
      { name: "ESPN NFL", url: "https://www.espn.com/espn/rss/nfl/news", active: true },
      { name: "ESPN MLB", url: "https://www.espn.com/espn/rss/mlb/news", active: true },
      { name: "ESPN College Football", url: "https://www.espn.com/espn/rss/ncf/news", active: true },
      { name: "ESPN College Basketball", url: "https://www.espn.com/espn/rss/ncb/news", active: true },
      { name: "247Sports", url: "https://247sports.com/feeds/articles/rss/", active: true },
      { name: "CBS Sports CFB", url: "https://www.cbssports.com/rss/headlines/college-football", active: true },
      { name: "On3 Kentucky", url: "https://www.on3.com/teams/kentucky-wildcats/rss/", active: true },
      { name: "On3 Clemson", url: "https://www.on3.com/teams/clemson-tigers/rss/", active: true },
      { name: "Kentucky Sports Radio", url: "https://kentuckysportsradio.com/feed/", active: true },
      { name: "TigerNet (Clemson)", url: "https://www.tigernet.com/rss/news", active: true },
      { name: "Talking Chop (Braves)", url: "https://www.
