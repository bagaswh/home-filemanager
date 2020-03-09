class Stack {
  constructor(items, topIndex) {
    this.arr = [...items];
    this.topIndex = topIndex || this.arr.length - 1;
  }

  pop() {
    var item = this.arr[this.topIndex--];
    delete this.arr[this.topIndex];
    return item;
  }

  push(item) {
    this.arr[++this.topIndex] = item;
  }

  peek(index) {
    if (typeof index == 'undefined' || index === null) {
      index = 0;
    }
    return this.arr[this.topIndex + index];
  }
}

class DirectoryStack extends Stack {
  constructor(items, topIndex) {
    super(items, topIndex);
  }

  getCurrentDir() {
    return this.peek();
  }

  concatPaths() {
    return this.arr.slice(0, this.topIndex + 1).reduce(function(a, b) {
      return (a + '/' + b).replace(/\/\//, '/');
    }, '');
  }

  go(index) {
    if (this.peek(index) != 'undefined') {
      this.topIndex = index;
      return true;
    }
    return false;
  }

  next() {
    if (typeof this.peek(1) != 'undefined') {
      this.topIndex++;
      return true;
    }
    return false;
  }

  previous() {
    if (typeof this.peek(-1) != 'undefined') {
      this.topIndex--;
      return true;
    }
    return false;
  }
}

var dir = localStorage.getItem('dir');
if (dir) {
  dir = JSON.parse(dir);
} else {
  dir = null;
}

new Vue({
  el: '#app',
  data: {
    ready: false,
    files: [],
    sortBy: '',

    // I could've just learned vue-router but no, too lazy...
    dirStack: dir ? new DirectoryStack(dir.arr, dir.topIndex) : new DirectoryStack(['/']),
    currentDir: ''
  },
  created: function() {
    var vm = this;
    var currentDir = vm.dirStack.concatPaths();
    vm.currentDir = currentDir;
    this.fetchDir(currentDir).then(function(json) {
      vm.ready = true;
      vm.files = json;
    });
  },
  watch: {
    sortBy: function(val) {
      switch (val) {
        case 'size': {
          this.files.sort(function(a, b) {
            return a.Size - b.Size;
          });
        }

        case 'date': {
          this.files.sort(function(a, b) {
            return new Date(b.ModTime).getTime() - new Date(a.ModTime).getTime();
          });
        }
      }
    },
    dirStack: {
      handler: function(val, old) {
        this.currentDir = this.dirStack.concatPaths();
        localStorage.setItem('dir', JSON.stringify(val));
      },
      deep: true
    },
    currentDir: function(newValue, oldValue) {
      var vm = this;
      this.fetchDir(newValue).then(function(json) {
        vm.files = json;
      });
    }
  },
  methods: {
    getFileSize(bytes) {
      return (bytes / 1000000).toFixed(1) + ' MB';
    },
    fetchDir: function(dirName, cb) {
      return fetch('/files/' + dirName).then(function(res) {
        return res.json().then(function(json) {
          return json;
        });
      });
    },
    goToDirectoryIndex: function(index) {
      this.dirStack.go(index);
    },
    goToPage: function(name) {
      window.location.href = name;
    },
    enterDirectory: function(dirName) {
      this.dirStack.push(dirName);
    },
    nextDir: function() {
      this.dirStack.next();
    },
    prevDir: function() {
      this.dirStack.previous();
    },
    isAbleToNext: function() {
      return !!this.dirStack.peek(1);
    },
    isAbleToPrev: function() {
      return !!this.dirStack.peek(-1);
    },
    getCompleteCurrentDir() {
      return this.dirStack.concatPaths();
    }
  }
});
