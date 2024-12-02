class TrieNode {
    constructor() {
        this.children = {};
        this.string = '';
    }
}


class Trie {
    constructor() {
        this.root = new TrieNode();
    }

    insert(word, data) {
        let node = this.root;
        for(let char of word) {
            if(!node.children[char]) {
                node.children[char] = new TrieNode();
            }
            node = node.children[char];
        }
        node.string = data;
    }

    search(word) {
        let node = this.root;
        for(let char of word) {
            if(!node.children[char]) {
                return false;
            }
            console.log(char);
            node = node.children[char];
        }
        return node.string;
    }

    #searchNode(word) {
        let node = this.root;
        for(let char of word) {
            if(!node.children[char]) {
                return false;
            }
            node = node.children[char];
        }
        return node;
    }

    #dfs(node, result, limit) {
        if(node.string) {
            result.push(node.string);
            if(result.length === limit) {
                throw new Error();
            }
        }
        for(let key in node.children) {
            this.#dfs(node.children[key], result, limit);
        }
    }

    searchStartWith(prefix, limit = 5) {
        const result = [];
        const node = this.#searchNode(prefix);
        if(node) {
            try {
                this.#dfs(node, result, limit);
            }
            catch(e) { }
        }
        return result;
    }
}

