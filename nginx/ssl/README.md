# SSL Certificates

Place your SSL certificates here:
- fullchain.pem (certificate chain)
- privkey.pem (private key)

For Let's Encrypt certificates, you can use:
```bash
sudo certbot --nginx -d your-domain.com
# Then copy the certificates:
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./nginx/ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./nginx/ssl/
sudo chown $(whoami):$(whoami) ./nginx/ssl/*.pem
```

For self-signed certificates (testing only):
```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ./nginx/ssl/privkey.pem \
  -out ./nginx/ssl/fullchain.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```
