FROM docker.io/library/haproxy:alpine

COPY docker/haproxy.cfg /usr/local/etc/haproxy/haproxy.cfg
