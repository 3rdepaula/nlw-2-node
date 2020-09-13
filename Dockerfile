FROM node:latest
COPY . /etc/data
WORKDIR /etc/data
COPY package.json /etc/data/package.json
RUN ["yarn", "install"]
ENTRYPOINT ["yarn", "start"]
# CMD ["tsnd","src/server.ts"]
EXPOSE 3333