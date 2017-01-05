require 'sinatra'
require 'json'

class App < Sinatra::Base
  get '/' do
    File.read('views/index.html')
  end

  get '/favorites/?' do
    response.header['Content-Type'] = 'application/json'
    File.read('data.json')
  end

  put '/favorites/?' do
    unless params['name'] && params['oid']
      return 'Invalid Request'
    end

    response.header['Content-Type'] = 'application/json'
    file = JSON.parse(File.read('data.json'))
    movie = { name: params['name'], oid: params['oid'] }
    file << movie
    File.write('data.json', JSON.pretty_generate(file))
    movie.to_json
  end
end
