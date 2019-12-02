FROM node:12-alpine

COPY ./package.json /pull-request-labeler/package.json
COPY ./tsconfig.json /pull-request-labeler/tsconfig.json
COPY ./entrypoint.sh /entrypoint.sh

RUN cd /pull-request-labeler && npm install
COPY ./src/ /pull-request-labeler/src/

ENTRYPOINT ["/entrypoint.sh"]
