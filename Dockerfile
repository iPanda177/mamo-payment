FROM node:18-alpine

EXPOSE 3000
WORKDIR /app

COPY package.json .
RUN yarn install

COPY . .
RUN yarn run build

CMD ["yarn", "run", "start"]
