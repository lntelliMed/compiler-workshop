// CS Saturdays - Compilers workshop on 11/4/2017
// Final solution provided by David Yang / Fullstack Academy

function Calculator(inputString) {
  this.tokenStream = this.lexer(inputString);
}

Calculator.prototype.lexer = function (inputString) {
  var tokenTypes = [
    ["NUMBER", /^\d+/],
    ["ADD", /^\+/],
    ["SUB", /^\-/],
    ["MUL", /^\*/],
    ["DIV", /^\//],
    ["LPAREN", /^\(/],
    ["RPAREN", /^\)/]
  ];

  var tokens = [];
  var matched = true;

  while (inputString.length > 0 && matched) {
    matched = false;
    tokenTypes.forEach(tokenRegex => {
      var token = tokenRegex[0];
      var regex = tokenRegex[1];

      var result = regex.exec(inputString);

      if (result !== null) {
        matched = true;
        tokens.push({
          name: token,
          value: result[0]
        });
        inputString = inputString.slice(result[0].length);
      }
    })

    if (!matched) {
      throw new Error("Found unparseable token: " + inputString);
    }

  }

  return tokens;

}


Calculator.prototype.peek = function() {
  return this.tokenStream[0];
}


Calculator.prototype.get = function() {
  return this.tokenStream.shift(); // return the first token and modify the token stream itself
}

// new TreeNode("Expression", t, a)
// children = [t, a]
function TreeNode(name, ...children) {
  this.name = name;
  this.children = children;
}

// Expression => Term A
Calculator.prototype.parseExpression = function () {
  var term = this.parseTerm();
  var a = this.parseA();

  return new TreeNode("Expression", term, a);
}

// Term => Factor B
Calculator.prototype.parseTerm = function() {
  var factor = this.parseFactor();
  var b = this.parseB();

  return new TreeNode("Term", factor, b);
}

/*  A => + Term A
      => - Term A
      => epsilon ("")
*/

Calculator.prototype.parseA = function() {
  var nextToken = this.peek();

  if(nextToken && nextToken.name === "ADD") {
    // + Term A
    this.get(); // pulls the plus sign off the token stream
    var term = this.parseTerm();
    var insideA = this.parseA();
    return new TreeNode("A", "+", term, insideA);
  } else if(nextToken && nextToken.name === "SUB") {
    // - Term A
    this.get(); // pulls the plus sign off the token stream
    return new TreeNode("A", "-", this.parseTerm(), this.parseA());
  } else {
    // Epsilon ("")
    return new TreeNode("A");
  }
}

// 1+3*4
// + - * / ^
// parseB
// * F B
// / F B
// eps
Calculator.prototype.parseB = function() {
  var nextToken = this.peek();

  if(nextToken && nextToken.name === "MUL") {
    // * F B
    this.get(); // pulls the plus sign off the token stream
    return new TreeNode("B", "*", this.parseFactor(), this.parseB());
  } else if(nextToken && nextToken.name === "DIV") {
    // / F B
    this.get(); // pulls the plus sign off the token stream
    return new TreeNode("B", "/", this.parseFactor(), this.parseB());
  } else {
    // Epsilon ("")
    return new TreeNode("B");
  }
}

/*
  Factor => Number
        | ( Expression )
        | - Factor
*/
Calculator.prototype.parseFactor = function() {
  var nextToken = this.peek();

  if(nextToken.name === "NUMBER") {
    return new TreeNode("Factor", this.get().value);
  } else if(nextToken.name === "LPAREN") {
    // ( E )
    this.get(); // removes the LPAREN from the Token Stream
    var expr = this.parseExpression();
    this.get(); // removes the RPAREN from the Token Stream
    return new TreeNode("Factor", "(", expr, ")");
  } else if(nextToken.name === "SUB") {
    // - Factor
    // 1 + -(3*4)
    return new TreeNode("Factor", "-", this.parseFactor());
  } else {
    throw new Error("Expected to get Factor, did not find anything.")
  }
}




TreeNode.prototype.accept = function(visitor) {
  return visitor.visit(this);
}

function PrintOriginalVisitor() {};

PrintOriginalVisitor.prototype.visit = function(treeNode) {
  var node = treeNode;
  switch(node.name) {
    case "Expression":
      var term = node.children[0];
      var a = node.children[1];

      var termOutput = term.accept(this);
      var aOutput = a.accept(this);
      return termOutput + aOutput;
      break;
    case "Term":
      var factorOutput = node.children[0].accept(this);
      var bOutput = node.children[1].accept(this);

      return factorOutput + bOutput;
      break;
    case "A":
      if(node.children.length > 0) {
        // + -
        // children [ "+", termNode, aNode]
        var termNode = node.children[1];
        var aNode = node.children[2];
        return " plus " + termNode.accept(this) + aNode.accept(this);
        // return node.children[0] + termNode.accept(this) + aNode.accept(this);
      } else {
        return "";
      }
      break;
    case "B":
      if(node.children.length > 0) {
        // + -
        // children [ "+", termNode, aNode]
        var factorNode = node.children[1];
        var bNode = node.children[2];
        return node.children[0] + factorNode.accept(this) + bNode.accept(this);
      } else {
        return "";
      }
      break;
    case "Factor":
      if(node.children[0] === "(") {
        var subExpression = node.children[1];
        // return node.children[0] + subExpression.accept(this) + node.children[2];
        return "[[" + subExpression.accept(this) + "]]";
      } else if(node.children[0] === "-") {
        return "-" + node.children[1].accept(this);
      } else {
        // number case
        return node.children[0];
      }
      break;



  }
}

function RPNVisitor() {};

RPNVisitor.prototype.visit = function(treeNode) {
  var node = treeNode;
  switch(node.name) {
    case "Expression":
      var term = node.children[0];
      var a = node.children[1];

      var termOutput = term.accept(this);
      var aOutput = a.accept(this);
      return termOutput + aOutput;
      break;
    case "Term":
      var factorOutput = node.children[0].accept(this);
      var bOutput = node.children[1].accept(this);

      return factorOutput + bOutput;
      break;
    case "A": // + T A => TA+
      if(node.children.length > 0) {
        // + -
        // children [ "+", termNode, aNode]
        var termNode = node.children[1];
        var aNode = node.children[2];
        return termNode.accept(this) + aNode.accept(this) + node.children[0];
        // return node.children[0] + termNode.accept(this) + aNode.accept(this);
      } else {
        return "";
      }
      break;
    case "B":
      if(node.children.length > 0) {
        // + -
        // children [ "+", termNode, aNode]
        var factorNode = node.children[1];
        var bNode = node.children[2];
        return factorNode.accept(this) + bNode.accept(this) + node.children[0];
      } else {
        return "";
      }
      break;
    case "Factor":
      if(node.children[0] === "(") {
        var subExpression = node.children[1];
        return subExpression.accept(this);
        // return "[[" + subExpression.accept(this) + "]]";
      } else if(node.children[0] === "-") {
        return "-" + node.children[1].accept(this);
      } else {
        // number case
        return node.children[0] + " ";
      }
      break;



  }
}


var calc = new Calculator("1+2*(4+3)");
// console.log(calc.tokenStream);

var expression = calc.parseExpression();
// console.log(expression);

// var printVisitor = new PrintOriginalVisitor();
// console.log(expression.accept(printVisitor));
var rpnVisitor = new RPNVisitor();
console.log(expression.accept(rpnVisitor));
