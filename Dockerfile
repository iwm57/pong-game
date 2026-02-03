FROM nginx:alpine
COPY --chown=nginx:nginx . /usr/share/nginx/html

# Configure nginx to listen on port 3000
RUN sed -i 's/listen 80;/listen 3000;/g' /etc/nginx/conf.d/default.conf

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
