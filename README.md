
# JavaScript Module Server

[![Build Status](https://travis-ci.org/ustream/jms.svg?branch=master)](https://travis-ci.org/ustream/jms)


JMS is an AMD module server for Javascript.
It serves modules asynchronously in a fast and efficient way, by handling their dependencies at server side.

JMS use the idea called "Negative loading" presented at [JSConf EU 2012](https://www.youtube.com/watch?v=mGENRKrdoGY).

For more information on JMS, I recommend my talk at [Craft conf 2014](http://www.ustream.tv/recorded/46810270).

It's still under development.

## Installation

```
git clone https://github.com/ustream/jms.git
cd jms
sudo npm install pm2 -g
npm install
	
```

### Tests

```
npm test
```

### Configuration

See config/*.js

Every command can handle the `--config <configname>` parameter,
to load separate config files.


### Storage

JMS stores data in redis, for a quick install on osx, run

```
brew install redis
redis-server /usr/local/etc/redis.conf > /dev/null &
```

### Deploy

If Redis is running, you can deploy your javascript modules to JMS.

The deploy script handle two optimal parameters:

`./jms deploy [repository] [--config <configname>]`

Where `repository` is the key from `config.codebase.sources`,
and the `configname` is the configuration from `config/`

For a quick, example code, run

```
./jms deploy dev --config local
```

If you haven't modified the configs, it will deploy all the small codebase from examples/dev.

### Start

Start a JMS server using the local config

```
./jms start
```

Open `examples/dev.html` in your browser to see it work, open the dev console, for more info. 

After this, try to deploy the live code, and open `examples/index.html`, and play around.



## Other commands

### purge

To clear the internal cache

```
./jms purge [--config <configname>]
```

To remove a single source repo cache

```
./jms purge repoId [--config <configname>]
```

### stop

To stop the server

```
./jms stop
```


### restart | reload

To restart the server

```
./jms restart
```



### status

To get some status info


```
./jms status
```

It should output something like this

```
JMS online with 8 processes
    concurrent requests 0
    requests / sec 0
    cpu usage (%) 0
    memory usage (MB) 312
    total requests served 6
    exits per sec 0
```