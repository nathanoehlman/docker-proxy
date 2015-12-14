# Docker Proxy

Designed for MacOSX users of Docker, this allows you to pretend your Docker VM doesn't exist, and use local addresses for your exposed containers.

It simply queries docker to find out what TCP ports are exposed by the various running containers, and creates a local proxy for them (providing that the port is free).

## Installation

```npm install -g docker-proxy```

```docker-proxy```