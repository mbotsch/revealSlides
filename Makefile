
.PHONY: clean

node_modules: Makefile package.json gruntfile.js
	npm install

clean:
	rm -rf node_modules

