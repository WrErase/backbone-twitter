require 'coffee-script'

namespace :js do
  desc "compile coffee-scripts from ./views to ./public/javascripts"
  task :compile do
    source = "#{File.dirname(__FILE__)}/views/"
    javascripts = "#{File.dirname(__FILE__)}/public/javascript/"

    Dir.foreach(source) do |cf|
      if cf =~ /\.coffee$/
        js = CoffeeScript.compile File.read("#{source}#{cf}") 
        open "#{javascripts}#{cf.gsub('.coffee', '.js')}", 'w' do |f|
          f.puts js
        end 
      end 
    end
  end
end
