
api_search             = 'http://search.twitter.com/search.json'
api_show_user          = 'http://api.twitter.com/1/users/'
api_user_timeline      = 'http://api.twitter.com/1/statuses/user_timeline/'
api_statuses_show      = 'http://api.twitter.com/1/statuses/show/'
api_account_rate_limit = 'http://api.twitter.com/1/account/rate_limit_status.json'
api_account_totals     = 'http://api.twitter.com/1/account/totals.json'
api_trends             = 'http://api.twitter.com/1/trends.json'

geo_distance           = '10mi'


#
# Parse a tweet to build links for hashtags and users
#
parse_tweet = (text) ->
  return if typeof text isnt 'string'

  return text if /a href/.test(text)

  text = text.replace(/#(.*?)(\s|\,|$)/g, "<a href='#search?q=%23$1'>#$1</a>$2")
  text = text.replace(/(http:\/\/.*?)(\s|\,|\:|$)/i, "<a href='$1'>$1</a>$2")
  text = text.replace(/@(.*?)(\s|\,|\:|$)/g, "@<a href='#users/show/$1'>$1</a>$2")

  text


#
# Build url params for API interactions
#
build_params = (query) ->
  params = '?'

  _.each(query, (element, key) ->
    params += key + '=' + element + '&' if element?
  )
  params += 'callback=?'

  params


#
# Build seconds/minutes/hours ago strings for tweet timestamps
#
parse_time_ago = (date_str) ->
  start = new Date(date_str)
  return unless start?

  now = new Date
  ago = Math.round((now - start) / 1000)

  ago_str = ''
  if ago <= 60
    if ago is 1
      ago_str = ago + ' second ago'
    else
      ago_str = ago + ' seconds ago'

  else if ago < 3600
    ago = Math.round(ago / 60)
    if ago is 1
      ago_str = ago + ' minute ago'
    else
      ago_str = ago + ' minutes ago'

  else if ago < 86400
    ago = Math.round(ago / 3600)
    if ago is 1
      ago_str = ago + ' hour ago'
    else
      ago_str = ago + ' hours ago'

  else
    ago = Math.round(ago / 86400)
    if ago is 1
      ago_str = ago + ' day ago'
    else
      ago_str = ago + ' days ago'

  ago_str


refresh_limits = (account) ->
  timer = undefined

  return ->
    return if timer

    timer = setTimeout(
      ->
        account.fetch_rate_limit()
        timer = undefined
      , 60000
    )


#
# Models
#


# User Account
class Account extends Backbone.Model
  initialize: ->
    @fetch_rate_limit()

  fetch_rate_limit: ->
    $.getJSON(api_account_rate_limit + '?callback=?')
    .done( (data, textStatus, xhr) =>
      @set(data)

      return data
    )
    .fail( (xhr, textStatus) =>
    )


  totals: ->
    $.getJSON(api_account_totals)
    .done( (data, textStatus, xhr) =>
      @set(data)

      return data
    )
    .fail( (xhr, textStatus) =>
    )


class User extends Backbone.Model
  urlRoot: api_show_user

  fetch: ->
    params = '?'

    if @get('screen_name')?
      params += "screen_name=" + @get('screen_name')
    else if @get('user_id')?
      params += "user_id=" + @get('user_id')
    else
      return

    params += '&callback=?'

    $.getJSON(@urlRoot + 'show.json' + params)
    .done( (data, textStatus, xhr) =>
      descr = parse_tweet(data.description)
      data.description = descr

      @set(data)
    )
    .fail( (xhr, textStatus) ->
      alert(textStatus)
    )


class Tweet extends Backbone.Model
  initialize: ->
    @bind('change', @parse_tweets)
    @parse_tweets()

  parse_tweets: ->
    text = parse_tweet( @get('text') )
    time_ago = parse_time_ago( @get('created_at'))
    @set({text: text, time_ago: time_ago}, {silent: true})


class Trend extends Backbone.Model
  url: api_trends

  initialize: ->

  fetch: ->
    $.getJSON(@url + '.json&callback=?')
    .done( (data) =>
      @set(data)
    )
    .fail( (xhr, textStatus) ->
      alert(textStatus)
    )


#
# Collections
#

class TimelineList extends Backbone.Collection
  model: Tweet

  url: api_user_timeline

  fetch: (query) ->
    params = build_params(query)

    $.getJSON(@url + @user_id + '.json' + params)
    .done( (data) =>
      tweets = []
      tweets.push( new @model(obj) ) for obj in data

      @reset(tweets)
    )
    .fail( (xhr, textStatus) ->
      alert(textStatus)
    )


class TweetList extends Backbone.Collection
  model: Tweet

  url: api_search

  send_query: (query, callback) ->
    params = ''
    tweets = []

    if typeof query isnt 'string'
      params = build_params(query)

    else if typeof query is 'string'
      params += query.replace(/\#/g, '%23') + '&callback=?'

    $.getJSON(@url + params)
    .done( (data) =>
      return unless data.results?

      tweets.push( new @model(obj) ) for obj in data.results

      callback(tweets) if callback?
    )
    .fail( (xhr, textStatus) ->
      # TBD - Cleaner error
      alert(textStatus)
    )

    tweets

  fetch: (query) =>
    @send_query(query, (tweets) =>
      @reset(tweets) if tweets?
    )

  fetch_more: (query) =>
    @send_query(query, (tweets) =>
      @add(tweets) if tweets?
    )


class TrendsList extends Backbone.Collection
  model: Trend

  url: api_trends

  fetch: ->
    $.getJSON(@url '.json&callback=?')
    .done( (data) =>
      trends = []
      trends.push( new @model(obj) ) for obj in data

      @reset(trends)
    )
    .fail( (xhr, textStatus) ->
      alert(textStatus)
    )



#
# Views
#

class AccountView extends Backbone.View
  template: $('#account-tmpl')

  initialize: ->
    @model.bind('change', @render)

    @render

  render: =>
    content = @template.tmpl(@model.toJSON())
    $(@el).html(content)

    this


class UserView extends Backbone.View
  template: $('#user-tmpl')

  initialize: ->
    @model.bind('change', @render)

  render: =>
    content = @template.tmpl(@model.toJSON())
    $(@el).html(content)

    this


class TweetView extends Backbone.View
  tagName: 'div'
  className: 'tweet'

  initialize: (options) ->
    @template = options.template

    @model.bind('change', @render)

  render: =>
    if @model.get('text')?
      content = @template.tmpl(@model.toJSON())
      $(@el).html(content)

    this

  clear: =>
    @model.collection.remove(@model)


class TweetListView extends Backbone.View
  tweet_template: $('#result-tmpl')

  initialize: ->
    @collection.bind('reset', @render)

  render: =>
    $(@el).empty()

    els = []
    @collection.each( (model) =>
      view = new TweetView({
        model: model
        template: @tweet_template
      })

      els.push(view.render().el)
    )
    $(@el).append(els)

    this


class TimelineView extends Backbone.View
  tweet_template: $('#tweet-tmpl')

  initialize: ->
    @collection.bind('reset', @render)

  render: =>
    $(@el).empty()

    els = []
    @collection.each( (model) =>
      view = new TweetView({
        model: model
        template: @tweet_template
      })

      els.push(view.render().el)
    )
    $(@el).append(els)

    this


class MapView extends Backbone.View
  initialize: ->
    @myOptions = {
       zoom: 12
       mapTypeId: google.maps.MapTypeId.ROADMAP
    }
    @last_window = undefined

    @collection.bind('add', @add_tweet)
    @collection.bind('reset', @render_collection)

  render: =>
    @myLatlng= new google.maps.LatLng(@latitude, @longitude)
    @myOptions.center = @myLatlng
    @map = new google.maps.Map(document.getElementById("map-canvas"), @myOptions)

    @marker = new google.maps.Marker({
      position: @myLatlng
      map: @map
      title: "You Are Here"
    })

    google.maps.event.addListener(@marker, 'click', =>
      @map.panTo(@marker.getPosition())
    )

    this

  render_tweet: (model) =>
    if model.get('geo')?.coordinates?
      latitude = model.get('geo').coordinates[0]
      longitude = model.get('geo').coordinates[1]

      latlng = new google.maps.LatLng(latitude, longitude)
      console.log(model)

      tweet_marker = new google.maps.Marker({
        position: latlng
        map: @map
        title: model.get('from_user')
      })

      info_window = new google.maps.InfoWindow({
        map: @map
        content: model.get('from_user') + '<br />' + model.get('text')
      })

      google.maps.event.addListener(tweet_marker, 'click', =>
        @last_window.close() if @last_window?
        @last_window = info_window
        @map.panTo(tweet_marker.getPosition())
        info_window.open(@map, tweet_marker)
      )

  render_collection: =>
    @collection.each( (model) =>
      @render_tweet(model)
    )

  add_tweet: (model) =>
    @render_tweet(model)

class SearchScreen extends Backbone.View
  initialize: (options) ->
    @tweets = new TweetList
    @tweetsView = new TweetListView({collection: @tweets, id: 'tweet-list'})

    @query = options.query

  render: ->
    $(@el).empty()
    $(@el).append( @tweetsView.render().el )

    @tweets.fetch(@query)

    this


class UserScreen extends Backbone.View
  initialize: (options) ->
    @user = new User
    @timeline = new TimelineList
    @user_id = options.user_id

    @userView     = new UserView({model: @user, id: 'user-info'})
    @timelineView = new TimelineView({collection: @timeline, id: 'tweet-list'})

  render: ->
    @user.set({screen_name: @user_id}).fetch()

    @timeline.user_id = @user_id
    @timeline.fetch({count: 25, include_rts: 1, exclude_replies: true})

    $(@el).empty()
    $(@el).append( @userView.render().el )
    $(@el).append( @timelineView.render().el )

    this


class TweetScreen extends Backbone.View
  initialize: (options) ->
    @tweet = new Tweet({id: options.tweet_id})
    @tweetView = new TweetView({model: @tweet, id: $('tweet-detail'), template: $('#tweet-detail-tmpl')})

    @tweet.fetch()

  render: ->
    $(@el).empty()
    $(@el).append( @tweetView.render().el )

    this


class MapScreen extends Backbone.Model
  initialize: ->
    @tweets = new TweetList

  find_locations: ->
    if Modernizr.geolocation
      navigator.geolocation.getCurrentPosition( (position) =>
        geo_str  = position.coords.latitude + ','
        geo_str += position.coords.longitude + ','
        geo_str += geo_distance

        @mapView.latitude = position.coords.latitude
        @mapView.longitude = position.coords.longitude
        @mapView.render()

        # Geo applied after rpp, so we can end up with no matches
        @tweets.fetch({geocode: geo_str, rpp: 100, lang: 'en', page: 1, exclude_replies: true})
        @tweets.fetch_more({geocode: geo_str, rpp: 100, lang: 'en', page: 2, exclude_replies: true})
      ,
      (error) ->
        if error.code is 1
          alert('Permission Denied')
        else if error.code is 2
          alert('Position Unavailable')
      )

  render: ->
    $('#main').empty()
    $('#main').append( '<div id="map-canvas"></div>' )

    @mapView = new MapView({collection: @tweets, el: '#map-canvas'})

    @mapView.render()

    @find_locations()


class TimeLineScreen extends Backbone.View
  initialize: ->
  render: ->


$ ->
# TBD
#  do_refresh = refresh_limits(account)

  screen = undefined

  # TBD
  refresh_timer = undefined

  class Router extends Backbone.Router
    initialize: ->

    routes: {
      ''                  : 'index'
      'nearby*param'      : 'nearby'
      'users/show/:id'    : 'users'
      'statuses/show/:id' : 'statuses'
      'search*param'      : 'search'
      'trends'            : 'trends'
      'map'               : 'map'
    }

    index: ->

    nearby: (query) ->
      if Modernizr.geolocation
        navigator.geolocation.getCurrentPosition( (position) =>
          geo_str  = position.coords.latitude + ','
          geo_str += position.coords.longitude + ','
          geo_str += '10mi'

          @navigate('#search?geocode=' + geo_str + '&rpp=50&lang=en', {triggerRoute: true})
        ,
        (error) ->
          if error.code is 1
            alert('Permission Denied')
          else if error.code is 2
            alert('Position Unavailable')
        )

    users: (id) ->
      return unless id?

      screen = new UserScreen({user_id: id})
      $('#main').empty()
      $('#main').html( screen.render().el )

    statuses: (id) ->
      return unless id?

      screen = new TweetScreen({tweet_id: id})
      $('#main').empty()
      $('#main').html( screen.render().el )

    search: (query) ->
      screen = new SearchScreen({id: 'tweet-detail', query: query})
      $('#main').empty()
      $('#main').html( screen.render().el )

    trends: ->
      screen = new TrendsScreen({id: 'trends-list'})
      $('#main').empty()
      $('#main').html( screen.render().el )

    map: ->
      screen = new MapScreen
      screen.render()

  AppRouter = new Router
  Backbone.history.start()
