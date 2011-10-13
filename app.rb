require 'sinatra'
require 'haml'
require 'barista'

class Application < Sinatra::Base
  register Barista::Integration::Sinatra
end

get '/stylesheets/style.css' do
  scss :style
end

get '/javascript/application.js' do
  coffee :application
end

get '/' do
  haml :index
end
