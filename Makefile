###  INPUT & OUTPUT  ##########################################################

MD       := $(wildcard *.md)
HTML     := $(patsubst %.md, %.html, $(MD))

###  TEMPLATE CONFIG  #########################################################

OS       := $(shell uname -s)
REVEAL   := ./revealSlides
MACROS   := $(REVEAL)/macros.m4
TEMPLATE := $(REVEAL)/template.html
FILTER   := $(REVEAL)/pandoc-filter/$(OS)

SERVE_PORT := 8000

ifeq ($(OS),Linux)
	BROWSER   := xdg-open
else ifeq ($(OS),Darwin)
	BROWSER   := open
endif


###  EXPLICIT RULES  ##########################################################

.PHONY: clean html build serve serve_public

html: $(HTML)

$(HTML): $(SRC) $(TEMPLATE) $(MACROS)

clean:
	rm -f $(HTML)


###  IMPLICIT RULES  ##########################################################


%.html: %.md $(TEMPLATE) $(MACROS)
	m4 $(MACROS) $< | \
	pandoc \
	--from markdown+emoji+smart \
	--to revealjs \
	--section-divs \
	--no-highlight \
	--mathjax \
	--filter $(FILTER)/cols \
	--filter $(FILTER)/media \
	--template $(TEMPLATE) \
	--variable template=$(REVEAL) \
	--variable chalkboard=${<:.md=.json} \
	-o $@

build:
	rm -rf build/
	cp -r public/ build/
	rm -f build/animations
	rm -f build/css
	rm -f build/demos
	rm -f build/images
	rm -f build/js
	rm -f build/$(REVEAL)
	rm -f build/videos
	rsync -r --stats $(REVEAL) animations meshes css js demos videos images build/ --include-from $(REVEAL)/deploy.txt


serve: build
	sh -c "sleep 1; $(BROWSER) http://127.0.0.1:$(SERVE_PORT)" &
	python3 -m http.server --bind 127.0.0.1 --directory build/


serve_public: 
	sh -c "sleep 1; $(BROWSER) http://127.0.0.1:$(SERVE_PORT)" &
	python3 -m http.server --bind 127.0.0.1 --directory public/
