###  INPUT & OUTPUT  ##########################################################

MD       := $(wildcard *.md)
HTML     := $(patsubst %.md, %.html, $(MD))

###  TEMPLATE CONFIG  #########################################################

OS       := $(shell uname -s)
REVEAL   := ./revealSlides
MACROS   := $(REVEAL)/macros.m4
TEMPLATE := $(REVEAL)/template.html
FILTER   := $(REVEAL)/pandoc-filter/$(OS)

###  EXPLICIT RULES  ##########################################################

.PHONY: html setup server

html: Makefile $(HTML)

Makefile: $(REVEAL)/slide-build/Makefile
	@cp -u $(REVEAL)/slide-build/Makefile .
	@echo "Makefile was updated. Please start again."

setup: Makefile
	@cp -u $(REVEAL)/slide-build/* .
	@npm install

server: setup html
	@npm start

$(HTML): $(SRC) $(TEMPLATE) $(MACROS)

clean:
	rm -f $(HTML)

allclean:
	rm -rf $(HTML) package.json gruntfile.js node_modules


###  IMPLICIT RULES  ##########################################################


%.html: %.md
	m4 $(MACROS) $< | \
	pandoc \
	--from markdown+emoji+smart \
	--to revealjs \
	--no-highlight \
	--mathjax \
	--filter $(FILTER)/cols \
	--filter $(FILTER)/media \
	--template $(TEMPLATE) \
	--variable template=$(REVEAL) \
	-o $@

