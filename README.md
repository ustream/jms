[![Build Status](https://travis-ci.org/ustream/jms.svg?branch=master)](https://travis-ci.org/ustream/jms)

# JavaScript Module Server


JMS is an AMD module server for Javascript.
It serves modules asynchronously in a fast and efficient way, by handling their dependencies at server side.

JMS use the idea called "Negative loading" presented at [JSConf EU 2012](https://www.youtube.com/watch?v=mGENRKrdoGY).

It's still under development.

## Installation

```
git clone https://github.com/ustream/jms.git
cd jms
sudo npm install pm2 -g
npm install
	
```

## Tests

```
npm test
```

## Configure

see config/*.js


## Deploy

Fire up Redis, then:

```
./jms deploy
```

If you haven't modified the configs, it will deploy all the small codebases from examples/live and examples/dev

## Start

```
./jms start
```

## Other commands

To clear the internal cache

```
./jms purge
```

To remove a single source repo cache

```
./jms purge repoId
```
