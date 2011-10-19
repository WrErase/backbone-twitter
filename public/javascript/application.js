(function() {
  var Account, AccountView, MapScreen, MapView, SearchScreen, TimeLineScreen, TimelineList, TimelineView, Trend, TrendsList, Tweet, TweetList, TweetListView, TweetScreen, TweetView, User, UserScreen, UserView, api_account_rate_limit, api_account_totals, api_search, api_show_user, api_statuses_show, api_trends, api_user_timeline, build_params, geo_distance, parse_time_ago, parse_tweet, refresh_limits;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  }, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  api_search = 'http://search.twitter.com/search.json';
  api_show_user = 'http://api.twitter.com/1/users/';
  api_user_timeline = 'http://api.twitter.com/1/statuses/user_timeline/';
  api_statuses_show = 'http://api.twitter.com/1/statuses/show/';
  api_account_rate_limit = 'http://api.twitter.com/1/account/rate_limit_status.json';
  api_account_totals = 'http://api.twitter.com/1/account/totals.json';
  api_trends = 'http://api.twitter.com/1/trends.json';
  geo_distance = '10mi';
  parse_tweet = function(text) {
    if (typeof text !== 'string') {
      return;
    }
    if (/a href/.test(text)) {
      return text;
    }
    text = text.replace(/#(.*?)(\s|\,|$)/g, "<a href='#search?q=%23$1'>#$1</a>$2");
    text = text.replace(/(http:\/\/.*?)(\s|\,|\:|$)/i, "<a href='$1'>$1</a>$2");
    text = text.replace(/@(.*?)(\s|\,|\:|$)/g, "@<a href='#users/show/$1'>$1</a>$2");
    return text;
  };
  build_params = function(query) {
    var params;
    params = '?';
    _.each(query, function(element, key) {
      if (element != null) {
        return params += key + '=' + element + '&';
      }
    });
    params += 'callback=?';
    return params;
  };
  parse_time_ago = function(date_str) {
    var ago, ago_str, now, start;
    start = new Date(date_str);
    if (start == null) {
      return;
    }
    now = new Date;
    ago = Math.round((now - start) / 1000);
    ago_str = '';
    if (ago <= 60) {
      if (ago === 1) {
        ago_str = ago + ' second ago';
      } else {
        ago_str = ago + ' seconds ago';
      }
    } else if (ago < 3600) {
      ago = Math.round(ago / 60);
      if (ago === 1) {
        ago_str = ago + ' minute ago';
      } else {
        ago_str = ago + ' minutes ago';
      }
    } else if (ago < 86400) {
      ago = Math.round(ago / 3600);
      if (ago === 1) {
        ago_str = ago + ' hour ago';
      } else {
        ago_str = ago + ' hours ago';
      }
    } else {
      ago = Math.round(ago / 86400);
      if (ago === 1) {
        ago_str = ago + ' day ago';
      } else {
        ago_str = ago + ' days ago';
      }
    }
    return ago_str;
  };
  refresh_limits = function(account) {
    var timer;
    timer = void 0;
    return function() {
      if (timer) {
        return;
      }
      return timer = setTimeout(function() {
        account.fetch_rate_limit();
        return timer = void 0;
      }, 60000);
    };
  };
  Account = (function() {
    __extends(Account, Backbone.Model);
    function Account() {
      Account.__super__.constructor.apply(this, arguments);
    }
    Account.prototype.initialize = function() {
      return this.fetch_rate_limit();
    };
    Account.prototype.fetch_rate_limit = function() {
      return $.getJSON(api_account_rate_limit + '?callback=?').done(__bind(function(data, textStatus, xhr) {
        this.set(data);
        return data;
      }, this)).fail(__bind(function(xhr, textStatus) {}, this));
    };
    Account.prototype.totals = function() {
      return $.getJSON(api_account_totals).done(__bind(function(data, textStatus, xhr) {
        this.set(data);
        return data;
      }, this)).fail(__bind(function(xhr, textStatus) {}, this));
    };
    return Account;
  })();
  User = (function() {
    __extends(User, Backbone.Model);
    function User() {
      User.__super__.constructor.apply(this, arguments);
    }
    User.prototype.urlRoot = api_show_user;
    User.prototype.fetch = function() {
      var params;
      params = '?';
      if (this.get('screen_name') != null) {
        params += "screen_name=" + this.get('screen_name');
      } else if (this.get('user_id') != null) {
        params += "user_id=" + this.get('user_id');
      } else {
        return;
      }
      params += '&callback=?';
      return $.getJSON(this.urlRoot + 'show.json' + params).done(__bind(function(data, textStatus, xhr) {
        var descr;
        descr = parse_tweet(data.description);
        data.description = descr;
        return this.set(data);
      }, this)).fail(function(xhr, textStatus) {
        return alert(textStatus);
      });
    };
    return User;
  })();
  Tweet = (function() {
    __extends(Tweet, Backbone.Model);
    function Tweet() {
      Tweet.__super__.constructor.apply(this, arguments);
    }
    Tweet.prototype.initialize = function() {
      this.bind('change', this.parse_tweets);
      return this.parse_tweets();
    };
    Tweet.prototype.parse_tweets = function() {
      var text, time_ago;
      text = parse_tweet(this.get('text'));
      time_ago = parse_time_ago(this.get('created_at'));
      return this.set({
        text: text,
        time_ago: time_ago
      }, {
        silent: true
      });
    };
    return Tweet;
  })();
  Trend = (function() {
    __extends(Trend, Backbone.Model);
    function Trend() {
      Trend.__super__.constructor.apply(this, arguments);
    }
    Trend.prototype.url = api_trends;
    Trend.prototype.initialize = function() {};
    Trend.prototype.fetch = function() {
      return $.getJSON(this.url + '.json&callback=?').done(__bind(function(data) {
        return this.set(data);
      }, this)).fail(function(xhr, textStatus) {
        return alert(textStatus);
      });
    };
    return Trend;
  })();
  TimelineList = (function() {
    __extends(TimelineList, Backbone.Collection);
    function TimelineList() {
      TimelineList.__super__.constructor.apply(this, arguments);
    }
    TimelineList.prototype.model = Tweet;
    TimelineList.prototype.url = api_user_timeline;
    TimelineList.prototype.fetch = function(query) {
      var params;
      params = build_params(query);
      return $.getJSON(this.url + this.user_id + '.json' + params).done(__bind(function(data) {
        var obj, tweets, _i, _len;
        tweets = [];
        for (_i = 0, _len = data.length; _i < _len; _i++) {
          obj = data[_i];
          tweets.push(new this.model(obj));
        }
        return this.reset(tweets);
      }, this)).fail(function(xhr, textStatus) {
        return alert(textStatus);
      });
    };
    return TimelineList;
  })();
  TweetList = (function() {
    __extends(TweetList, Backbone.Collection);
    function TweetList() {
      this.fetch_more = __bind(this.fetch_more, this);
      this.fetch = __bind(this.fetch, this);
      TweetList.__super__.constructor.apply(this, arguments);
    }
    TweetList.prototype.model = Tweet;
    TweetList.prototype.url = api_search;
    TweetList.prototype.send_query = function(query, callback) {
      var params, tweets;
      params = '';
      tweets = [];
      if (typeof query !== 'string') {
        params = build_params(query);
      } else if (typeof query === 'string') {
        params += query.replace(/\#/g, '%23') + '&callback=?';
      }
      $.getJSON(this.url + params).done(__bind(function(data) {
        var obj, _i, _len, _ref;
        if (data.results == null) {
          return;
        }
        _ref = data.results;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          obj = _ref[_i];
          tweets.push(new this.model(obj));
        }
        if (callback != null) {
          return callback(tweets);
        }
      }, this)).fail(function(xhr, textStatus) {
        return alert(textStatus);
      });
      return tweets;
    };
    TweetList.prototype.fetch = function(query) {
      return this.send_query(query, __bind(function(tweets) {
        if (tweets != null) {
          return this.reset(tweets);
        }
      }, this));
    };
    TweetList.prototype.fetch_more = function(query) {
      return this.send_query(query, __bind(function(tweets) {
        if (tweets != null) {
          return this.add(tweets);
        }
      }, this));
    };
    return TweetList;
  })();
  TrendsList = (function() {
    __extends(TrendsList, Backbone.Collection);
    function TrendsList() {
      TrendsList.__super__.constructor.apply(this, arguments);
    }
    TrendsList.prototype.model = Trend;
    TrendsList.prototype.url = api_trends;
    TrendsList.prototype.fetch = function() {
      return $.getJSON(this.url('.json&callback=?')).done(__bind(function(data) {
        var obj, trends, _i, _len;
        trends = [];
        for (_i = 0, _len = data.length; _i < _len; _i++) {
          obj = data[_i];
          trends.push(new this.model(obj));
        }
        return this.reset(trends);
      }, this)).fail(function(xhr, textStatus) {
        return alert(textStatus);
      });
    };
    return TrendsList;
  })();
  AccountView = (function() {
    __extends(AccountView, Backbone.View);
    function AccountView() {
      this.render = __bind(this.render, this);
      AccountView.__super__.constructor.apply(this, arguments);
    }
    AccountView.prototype.template = $('#account-tmpl');
    AccountView.prototype.initialize = function() {
      this.model.bind('change', this.render);
      return this.render;
    };
    AccountView.prototype.render = function() {
      var content;
      content = this.template.tmpl(this.model.toJSON());
      $(this.el).html(content);
      return this;
    };
    return AccountView;
  })();
  UserView = (function() {
    __extends(UserView, Backbone.View);
    function UserView() {
      this.render = __bind(this.render, this);
      UserView.__super__.constructor.apply(this, arguments);
    }
    UserView.prototype.template = $('#user-tmpl');
    UserView.prototype.initialize = function() {
      return this.model.bind('change', this.render);
    };
    UserView.prototype.render = function() {
      var content;
      content = this.template.tmpl(this.model.toJSON());
      $(this.el).html(content);
      return this;
    };
    return UserView;
  })();
  TweetView = (function() {
    __extends(TweetView, Backbone.View);
    function TweetView() {
      this.clear = __bind(this.clear, this);
      this.render = __bind(this.render, this);
      TweetView.__super__.constructor.apply(this, arguments);
    }
    TweetView.prototype.tagName = 'div';
    TweetView.prototype.className = 'tweet';
    TweetView.prototype.initialize = function(options) {
      this.template = options.template;
      return this.model.bind('change', this.render);
    };
    TweetView.prototype.render = function() {
      var content;
      if (this.model.get('text') != null) {
        content = this.template.tmpl(this.model.toJSON());
        $(this.el).html(content);
      }
      return this;
    };
    TweetView.prototype.clear = function() {
      return this.model.collection.remove(this.model);
    };
    return TweetView;
  })();
  TweetListView = (function() {
    __extends(TweetListView, Backbone.View);
    function TweetListView() {
      this.render = __bind(this.render, this);
      TweetListView.__super__.constructor.apply(this, arguments);
    }
    TweetListView.prototype.tweet_template = $('#result-tmpl');
    TweetListView.prototype.initialize = function() {
      return this.collection.bind('reset', this.render);
    };
    TweetListView.prototype.render = function() {
      var els;
      $(this.el).empty();
      els = [];
      this.collection.each(__bind(function(model) {
        var view;
        view = new TweetView({
          model: model,
          template: this.tweet_template
        });
        return els.push(view.render().el);
      }, this));
      $(this.el).append(els);
      return this;
    };
    return TweetListView;
  })();
  TimelineView = (function() {
    __extends(TimelineView, Backbone.View);
    function TimelineView() {
      this.render = __bind(this.render, this);
      TimelineView.__super__.constructor.apply(this, arguments);
    }
    TimelineView.prototype.tweet_template = $('#tweet-tmpl');
    TimelineView.prototype.initialize = function() {
      return this.collection.bind('reset', this.render);
    };
    TimelineView.prototype.render = function() {
      var els;
      $(this.el).empty();
      els = [];
      this.collection.each(__bind(function(model) {
        var view;
        view = new TweetView({
          model: model,
          template: this.tweet_template
        });
        return els.push(view.render().el);
      }, this));
      $(this.el).append(els);
      return this;
    };
    return TimelineView;
  })();
  MapView = (function() {
    __extends(MapView, Backbone.View);
    function MapView() {
      this.add_tweet = __bind(this.add_tweet, this);
      this.render_collection = __bind(this.render_collection, this);
      this.render_tweet = __bind(this.render_tweet, this);
      this.render = __bind(this.render, this);
      MapView.__super__.constructor.apply(this, arguments);
    }
    MapView.prototype.initialize = function() {
      this.myOptions = {
        zoom: 12,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      };
      this.last_window = void 0;
      this.collection.bind('add', this.add_tweet);
      return this.collection.bind('reset', this.render_collection);
    };
    MapView.prototype.render = function() {
      this.myLatlng = new google.maps.LatLng(this.latitude, this.longitude);
      this.myOptions.center = this.myLatlng;
      this.map = new google.maps.Map(document.getElementById("map-canvas"), this.myOptions);
      this.marker = new google.maps.Marker({
        position: this.myLatlng,
        map: this.map,
        title: "You Are Here"
      });
      google.maps.event.addListener(this.marker, 'click', __bind(function() {
        return this.map.panTo(this.marker.getPosition());
      }, this));
      return this;
    };
    MapView.prototype.render_tweet = function(model) {
      var info_window, latitude, latlng, longitude, tweet_marker, _ref;
      if (((_ref = model.get('geo')) != null ? _ref.coordinates : void 0) != null) {
        latitude = model.get('geo').coordinates[0];
        longitude = model.get('geo').coordinates[1];
        latlng = new google.maps.LatLng(latitude, longitude);
        console.log(model);
        tweet_marker = new google.maps.Marker({
          position: latlng,
          map: this.map,
          title: model.get('from_user')
        });
        info_window = new google.maps.InfoWindow({
          map: this.map,
          content: model.get('from_user') + '<br />' + model.get('text')
        });
        return google.maps.event.addListener(tweet_marker, 'click', __bind(function() {
          if (this.last_window != null) {
            this.last_window.close();
          }
          this.last_window = info_window;
          this.map.panTo(tweet_marker.getPosition());
          return info_window.open(this.map, tweet_marker);
        }, this));
      }
    };
    MapView.prototype.render_collection = function() {
      return this.collection.each(__bind(function(model) {
        return this.render_tweet(model);
      }, this));
    };
    MapView.prototype.add_tweet = function(model) {
      return this.render_tweet(model);
    };
    return MapView;
  })();
  SearchScreen = (function() {
    __extends(SearchScreen, Backbone.View);
    function SearchScreen() {
      SearchScreen.__super__.constructor.apply(this, arguments);
    }
    SearchScreen.prototype.initialize = function(options) {
      this.tweets = new TweetList;
      this.tweetsView = new TweetListView({
        collection: this.tweets,
        id: 'tweet-list'
      });
      return this.query = options.query;
    };
    SearchScreen.prototype.render = function() {
      $(this.el).empty();
      $(this.el).append(this.tweetsView.render().el);
      this.tweets.fetch(this.query);
      return this;
    };
    return SearchScreen;
  })();
  UserScreen = (function() {
    __extends(UserScreen, Backbone.View);
    function UserScreen() {
      UserScreen.__super__.constructor.apply(this, arguments);
    }
    UserScreen.prototype.initialize = function(options) {
      this.user = new User;
      this.timeline = new TimelineList;
      this.user_id = options.user_id;
      this.userView = new UserView({
        model: this.user,
        id: 'user-info'
      });
      return this.timelineView = new TimelineView({
        collection: this.timeline,
        id: 'tweet-list'
      });
    };
    UserScreen.prototype.render = function() {
      this.user.set({
        screen_name: this.user_id
      }).fetch();
      this.timeline.user_id = this.user_id;
      this.timeline.fetch({
        count: 25,
        include_rts: 1,
        exclude_replies: true
      });
      $(this.el).empty();
      $(this.el).append(this.userView.render().el);
      $(this.el).append(this.timelineView.render().el);
      return this;
    };
    return UserScreen;
  })();
  TweetScreen = (function() {
    __extends(TweetScreen, Backbone.View);
    function TweetScreen() {
      TweetScreen.__super__.constructor.apply(this, arguments);
    }
    TweetScreen.prototype.initialize = function(options) {
      this.tweet = new Tweet({
        id: options.tweet_id
      });
      this.tweetView = new TweetView({
        model: this.tweet,
        id: $('tweet-detail'),
        template: $('#tweet-detail-tmpl')
      });
      return this.tweet.fetch();
    };
    TweetScreen.prototype.render = function() {
      $(this.el).empty();
      $(this.el).append(this.tweetView.render().el);
      return this;
    };
    return TweetScreen;
  })();
  MapScreen = (function() {
    __extends(MapScreen, Backbone.Model);
    function MapScreen() {
      MapScreen.__super__.constructor.apply(this, arguments);
    }
    MapScreen.prototype.initialize = function() {
      return this.tweets = new TweetList;
    };
    MapScreen.prototype.find_locations = function() {
      if (Modernizr.geolocation) {
        return navigator.geolocation.getCurrentPosition(__bind(function(position) {
          var geo_str;
          geo_str = position.coords.latitude + ',';
          geo_str += position.coords.longitude + ',';
          geo_str += geo_distance;
          this.mapView.latitude = position.coords.latitude;
          this.mapView.longitude = position.coords.longitude;
          this.mapView.render();
          this.tweets.fetch({
            geocode: geo_str,
            rpp: 100,
            lang: 'en',
            page: 1,
            exclude_replies: true
          });
          return this.tweets.fetch_more({
            geocode: geo_str,
            rpp: 100,
            lang: 'en',
            page: 2,
            exclude_replies: true
          });
        }, this), function(error) {
          if (error.code === 1) {
            return alert('Permission Denied');
          } else if (error.code === 2) {
            return alert('Position Unavailable');
          }
        });
      }
    };
    MapScreen.prototype.render = function() {
      $('#main').empty();
      $('#main').append('<div id="map-canvas"></div>');
      this.mapView = new MapView({
        collection: this.tweets,
        el: '#map-canvas'
      });
      this.mapView.render();
      return this.find_locations();
    };
    return MapScreen;
  })();
  TimeLineScreen = (function() {
    __extends(TimeLineScreen, Backbone.View);
    function TimeLineScreen() {
      TimeLineScreen.__super__.constructor.apply(this, arguments);
    }
    TimeLineScreen.prototype.initialize = function() {};
    TimeLineScreen.prototype.render = function() {};
    return TimeLineScreen;
  })();
  $(function() {
    var AppRouter, Router, refresh_timer, screen;
    screen = void 0;
    refresh_timer = void 0;
    Router = (function() {
      __extends(Router, Backbone.Router);
      function Router() {
        Router.__super__.constructor.apply(this, arguments);
      }
      Router.prototype.initialize = function() {};
      Router.prototype.routes = {
        '': 'index',
        'nearby*param': 'nearby',
        'users/show/:id': 'users',
        'statuses/show/:id': 'statuses',
        'search*param': 'search',
        'trends': 'trends',
        'map': 'map'
      };
      Router.prototype.index = function() {
        return this.navigate('#nearby', {
          triggerRoute: true
        });
      };
      Router.prototype.nearby = function(query) {
        if (Modernizr.geolocation) {
          return navigator.geolocation.getCurrentPosition(__bind(function(position) {
            var geo_str;
            geo_str = position.coords.latitude + ',';
            geo_str += position.coords.longitude + ',';
            geo_str += '10mi';
            return this.navigate('#search?geocode=' + geo_str + '&rpp=50&lang=en', {
              triggerRoute: true
            });
          }, this), function(error) {
            if (error.code === 1) {
              return alert('Permission Denied');
            } else if (error.code === 2) {
              return alert('Position Unavailable');
            }
          });
        }
      };
      Router.prototype.users = function(id) {
        if (id == null) {
          return;
        }
        screen = new UserScreen({
          user_id: id
        });
        $('#main').empty();
        return $('#main').html(screen.render().el);
      };
      Router.prototype.statuses = function(id) {
        if (id == null) {
          return;
        }
        screen = new TweetScreen({
          tweet_id: id
        });
        $('#main').empty();
        return $('#main').html(screen.render().el);
      };
      Router.prototype.search = function(query) {
        screen = new SearchScreen({
          id: 'tweet-detail',
          query: query
        });
        $('#main').empty();
        return $('#main').html(screen.render().el);
      };
      Router.prototype.trends = function() {
        screen = new TrendsScreen({
          id: 'trends-list'
        });
        $('#main').empty();
        return $('#main').html(screen.render().el);
      };
      Router.prototype.map = function() {
        screen = new MapScreen;
        return screen.render();
      };
      return Router;
    })();
    AppRouter = new Router;
    return Backbone.history.start();
  });
}).call(this);
