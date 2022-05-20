FROM nginx
	
RUN apt-get update && apt-get -qq -y install curl gnupg2 ca-certificates lsb-release debian-archive-keyring &&\
    curl https://nginx.org/keys/nginx_signing.key | gpg --dearmor \
    | tee /usr/share/keyrings/nginx-archive-keyring.gpg >/dev/null &&\
	echo "deb [signed-by=/usr/share/keyrings/nginx-archive-keyring.gpg] \
    http://nginx.org/packages/debian `lsb_release -cs` nginx" \ 
    | tee /etc/apt/sources.list.d/nginx.list &&\
	apt-get -qq -y install systemd &&\
	apt-get -qq -y install mc &&\
	apt-get -qq -y install wget
   

RUN mkdir -p /var/www/webcompiler/html &&\
	chown -R $USER:$USER /var/www/webcompiler/html &&\
	chmod -R 777 /var/www/webcompiler/html &&\
	mkdir -p /etc/nginx/sites-available/webcompiler &&\
	chown -R www-data:www-data /var/log/nginx &&\
	chmod -R 777 /var/log/nginx
	
COPY /html /var/www/webcompiler/html
COPY nginxconfig/default.conf.template /etc/nginx/conf.d/default.conf.template
COPY nginxconfig/nginx.conf /etc/nginx/nginx.conf
COPY nginxconfig/PascalWebCompiler.conf /etc/nginx/conf.d/default.conf
COPY nginxconfig/PascalWebCompiler.conf /etc/nginx/sites-enabled/PascalWebCompiler.conf
COPY index.html /var/www/html/index.html
CMD chmod -R 777 /etc/nginx/sites-enabled/PascalWebCompiler.conf &&\
	chmod -R 777 /etc/nginx/conf.d/default.conf &&\
	sed -i -e 's/$PORT/'"$PORT"'/g' /etc/nginx/sites-enabled/PascalWebCompiler.conf &&\
	sed -i -e 's/$PORT/'"$PORT"'/g' /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'


