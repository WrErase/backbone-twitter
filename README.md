## About

Simple backbone.js app using HTML5 geolocation to retreive tweets from people near year and
either list them, or plot them on a Google Map.  Uses backbone.js/coffeescript and the
Twitter+Google Maps APIs.

Once the initial html/css/javascript files are loaded from the server, all interactions with the
APIs and UI rendering is done client-side.  Hash fragments allow bookmarking of any "page" in the app.

This is just an experient, rather than an attempt to create Yet Another Twitter Client.
So, the functionality is still rather basic.  Hopefully it could be useful as an example, though.

The UI was also kept fairly basic, to work on mobile devices.

### Tweets Near You

Uses HTML5 Geolocation and the Twitter API to get a list of recent tweets near your location.
The UI supports the standard operations of viewing a specific user and their tweets as well as  
viewing a list of tweets for a hash tag.  OAuth has not yet been added, so you cannot directly view
your own information (timeline, etc).

### Map View

Uses the Google Maps API to plot any Tweets using geolocation within 10miles.  This only works
for tweets with geolocation data, and that data might not be totally accurate.  Also, if you are
using a device without GPS, then your location on the map is likely to be inaccurate.

## Requires

Ruby 1.9.2+
Gems: Sinatra, haml, exec-js, coffee-script

The server is a simple sinatra app to build and serve the html/css/js.  However, this could
be anything that supports haml/scss/coffeescript (node.js, rails, etc).  The core functionality 
is javascript using the jquery, jquery templates, backbone.js libraries.

## Setup

* bundle install
* Start it with: rackup <-p port>

## Limiations

* Currently does not use OAuth, so it just accesses the API anonymously
* Tested with Chrome 14, Firefox 6 and Mobile Safari (iPad 4.3.5)

## Warning

You will be worried by what people near you are tweeting.

## References

* http://code.google.com/apis/maps/documentation/javascript/
* https://dev.twitter.com/docs/api

* http://jashkenas.github.com/coffee-script/
* http://documentcloud.github.com/backbone/
* http://api.jquery.com/category/plugins/templates/
* http://html5boilerplate.com/

