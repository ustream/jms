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

## Configure

see conf/*.js


## Deploy

Fire up Redis, then:

```
./jms deploy
```

## Start

```
./jms start
```