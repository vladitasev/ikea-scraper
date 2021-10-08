# Ikea Scraper

Checks for availability of Ikea products

## Usage

```sh
yarn start <FILE-WITH-URLS-PATH>
```

where `<FILE-WITH-URLS-PATH>` is a newline-delimited file of URLs to scrape, for example:

```sh
yarn start urls.txt
```

Polls every 30 min, when a product becomes availabe, sends an email and stops polling for it.