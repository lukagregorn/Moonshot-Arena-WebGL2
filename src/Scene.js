export default class Scene {

    constructor(options = {}) {
        this.nodes = [...(options.nodes || [])];
    }

    addNode(node) {
        this.nodes.push(node);
    }

    removeNode(node) {
        const index = this.nodes.indexOf(node);
        if (index >= 0) {
            this.nodes.splice(index, 1);
            node.scene = null;
        }
    }

    traverse(before, after) {
        for (const node of this.nodes) {
            this.traverseNode(node, before, after);
        }
    }

    traverseNode(node, before, after) {
        if (before) {
            before(node);
        }
        for (const child of node.children) {
            this.traverseNode(child, before, after);
        }
        if (after) {
            after(node);
        }
    }

    clone() {
        return new Scene({
            ...this,
            nodes: this.nodes.map(node => node.clone()),
        });
    }
}
