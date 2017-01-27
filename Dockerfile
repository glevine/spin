FROM node:slim

RUN npm install -g yarn
RUN yarn cache clean
RUN yarn

RUN yarn global add nodemon
