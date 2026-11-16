FROM php:8.2-apache
RUN docker-php-ext-install mysqli && a2enmod rewrite
RUN printf '<Directory /var/www/html>\n AllowOverride All\n</Directory>\n' \
   > /etc/apache2/conf-available/htaccess.conf \
    && a2enconf htaccess
