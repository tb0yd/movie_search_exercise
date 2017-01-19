require 'sinatra'
require 'json'

class App < Sinatra::Base
  before do
    # parse JSON into accessible variable if json was sent
    if request.content_type == 'application/json'
      request.body.rewind
      @payload = JSON.parse request.body.read
    end
  end

  # UI page load
  get '/' do
    File.read('views/index.html')
  end

  # refresh favorites
  get '/favorites/?' do
    response.header['Content-Type'] = 'application/json'
    File.read('data.json')
  end

  # add favorite
  put '/favorites/?' do
    params = @payload
    unless params['name'] && params['oid']
      return 'Invalid Request'
    end

    # set content-type as JSON so response can be parsed
    response.header['Content-Type'] = 'application/json'

    # read data file, add movie to file
    file = JSON.parse(File.read('data.json'))
    movie = { name: params['name'], oid: params['oid'] }
    file << movie

    # save updated data
    File.write('data.json', JSON.pretty_generate(file))

    # return new favorite
    movie.to_json
  end

  # delete favorite
  delete '/favorites/?' do
    params = @payload
    unless params['name'] && params['oid']
      return 'Invalid Request'
    end

    # set content-type as JSON so response can be parsed
    response.header['Content-Type'] = 'application/json'

    # read data file, remove movie from file based on oid
    file = JSON.parse(File.read('data.json'))
    file = file.select { |item| item['oid'] != params['oid'] }

    # save updated data
    File.write('data.json', JSON.pretty_generate(file))

    # return all favorites
    file.to_json
  end
end
