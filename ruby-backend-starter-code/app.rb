require 'sinatra'
require 'json'

class App < Sinatra::Base
  before do
    if request.content_type == 'application/json'
      request.body.rewind
      @payload = JSON.parse request.body.read
    end
  end

  get '/' do
    File.read('views/index.html')
  end

  get '/favorites/?' do
    response.header['Content-Type'] = 'application/json'
    File.read('data.json')
  end

  put '/favorites/?' do
    params = @payload
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

  delete '/favorites/?' do
    params = @payload
    unless params['name'] && params['oid']
      return 'Invalid Request'
    end

    response.header['Content-Type'] = 'application/json'
    file = JSON.parse(File.read('data.json'))
    file = file.select { |item| item['oid'] != params['oid'] }
    File.write('data.json', JSON.pretty_generate(file))
    file.to_json
  end
end
