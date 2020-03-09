package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
	"os"
	"path"
	"strconv"
	"time"
)

type FileInfo struct {
	Name    string
	Size    int64
	Mode    os.FileMode
	ModTime time.Time
	IsDir   bool
}

var pathPrefix = "/home"
var path2nd = flag.String("path", "", "Root path of the file")
var port = flag.Int("port", 8000, "Port for http server")

func getJsonRes(name string) string {
	entries, _ := ioutil.ReadDir(name)

	list := []FileInfo{}
	for _, entry := range entries {
		f := FileInfo{
			Name:    entry.Name(),
			Size:    entry.Size(),
			Mode:    entry.Mode(),
			ModTime: entry.ModTime(),
			IsDir:   entry.IsDir(),
		}
		list = append(list, f)
	}

	output, _ := json.Marshal(list)
	return string(output)
}

func main() {
	flag.Parse()
	root := path.Join(pathPrefix, *path2nd)

	http.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("./static"))))

	http.HandleFunc("/files/", func(w http.ResponseWriter, r *http.Request) {
		unescaped, _ := url.PathUnescape(path.Join(root, r.URL.RequestURI()[7:]))
		fmt.Println(unescaped)
		stat, _ := os.Stat(unescaped)
		if stat.IsDir() {
			fmt.Fprint(w, getJsonRes(unescaped))
		} else {
			http.ServeFile(w, r, unescaped)
		}
	})

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		html, _ := os.Open("./static/index.html")
		defer html.Close()
		io.Copy(w, html)
	})

	log.Println(http.ListenAndServe(":"+strconv.Itoa(*port), nil))
}
