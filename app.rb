require 'sinatra'
require 'haml'
require 'execjs'
require 'coffee-script'

get '/stylesheets/style.css' do
  scss :style
end

get '/javascript/application.js' do
  coffee :application
end

get '/' do
  haml :index
end
