/**
 * Copyright (c) Tiny Technologies, Inc. All rights reserved.
 * Licensed under the LGPL or a commercial license.
 * For LGPL see License.txt in the project root for license information.
 * For commercial licenses see https://www.tiny.cloud/
 */

import { Fun } from '@ephox/katamari';
import { Compare, SelectorExists, SugarElement } from '@ephox/sugar';
import DomTreeWalker from '../api/dom/TreeWalker';
import * as CaretCandidate from '../caret/CaretCandidate';
import { isWhitespaceText } from '../text/Whitespace';
import * as NodeType from './NodeType';

const hasWhitespacePreserveParent = function (rootNode: Node, node: Node) {
  const rootElement = SugarElement.fromDom(rootNode);
  const startNode = SugarElement.fromDom(node);
  return SelectorExists.ancestor(startNode, 'pre,code', Fun.curry(Compare.eq, rootElement));
};

const isWhitespace = function (rootNode: Node, node: Node) {
  return NodeType.isText(node) && isWhitespaceText(node.data) && hasWhitespacePreserveParent(rootNode, node) === false;
};

const isNamedAnchor = function (node: Node) {
  return NodeType.isElement(node) && node.nodeName === 'A' && !node.hasAttribute('href') && (node.hasAttribute('name') || node.hasAttribute('id'));
};

const isContent = function (rootNode: Node, node: Node) {
  return (CaretCandidate.isCaretCandidate(node) && isWhitespace(rootNode, node) === false) || isNamedAnchor(node) || isBookmark(node);
};

const isBookmark = NodeType.hasAttribute('data-mce-bookmark');
const isBogus = NodeType.hasAttribute('data-mce-bogus');
const isBogusAll = NodeType.hasAttributeValue('data-mce-bogus', 'all');

const isEmptyNode = function (targetNode: Node, skipBogus: boolean) {
  let node, brCount = 0;

  if (isContent(targetNode, targetNode)) {
    return false;
  } else {
    node = targetNode.firstChild;
    if (!node) {
      return true;
    }

    const walker = new DomTreeWalker(node, targetNode);
    do {
      if (skipBogus) {
        if (isBogusAll(node)) {
          node = walker.next(true);
          continue;
        }

        if (isBogus(node)) {
          node = walker.next();
          continue;
        }
      }

      if (NodeType.isBr(node)) {
        brCount++;
        node = walker.next();
        continue;
      }

      if (isContent(targetNode, node)) {
        return false;
      }

      node = walker.next();
    } while (node);

    return brCount <= 1;
  }
};

const isEmpty = (elm: SugarElement<Node>, skipBogus: boolean = true) => isEmptyNode(elm.dom, skipBogus);

export {
  isEmpty
};
