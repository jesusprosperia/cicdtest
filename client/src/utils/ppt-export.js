import pptxgen from "pptxgenjs";

const getParagraph = (content, order, bullet) => {
  const paragraphs = [];

  content.forEach(c => {
    const styles = {};

    if (c.marks) {
      c.marks.forEach(x => styles[x.type] = true);
    }

    paragraphs.push({
      text: order ? order + '. ' + c.text : c.text,
      options: {
        fontSize: 12,
        bold: 'bold' in styles,
        italic: 'italic' in styles,
        strike: 'strike' in styles,
        breakLine: false
      }
    })
  })

  paragraphs[0].options.bullet = bullet !== undefined

  return paragraphs
}

const getHeading = (content, level, order, bullet) => {
  const texts = [];

  content.forEach(c => {
    texts.push({
      text: order ? order + '. ' + c.text : c.text,
      options: {
        fontSize: 10 + 4 * (4 - level),
        bullet: bullet !== undefined,
        bold: true
      }
    })
  })

  return texts;
}

const addMethodologySlide = (content, slide) => {
  let texts = [];

  content.forEach(d => {

    if(!d.content)
      return
      
    const _content = d.content;
    const _type = d.type;
    
    switch (_type) {
      case 'paragraph':
        texts = texts.concat(getParagraph(_content));
        break;

      case 'heading':
        texts = texts.concat(getHeading(_content, d.attrs.level || 1));
        break;

      case 'bullet_list':
        _content.forEach((c) => {
          if (c.type == 'list_item') {
            c.content.forEach(x => {
              if (x.type == 'paragraph') {
                texts = texts.concat(getParagraph(x.content, null, true));
              } else if (x.type == 'heading') {
                texts = texts.concat(getHeading(x.content, x.attrs.level || 1, null, true));
              }
            })
          }
        });
        break;

      case 'ordered_list':
        var order = d.attrs.order;

        _content.forEach((c, j) => {
          if (c.type == 'list_item') {
            c.content.forEach(x => {
              if (x.type == 'paragraph') {
                texts = texts.concat(getParagraph(x.content, order + j));
              } else if (x.type == 'heading') {
                texts = texts.concat(getHeading(x.content, x.attrs.level || 1, order + j));
              }
            })
          }
        });
        break;

      default:
        break;
    }
  });

  console.log(texts);
  if (texts.length) {
    slide.addText(texts, {
      x: 0, y: 0, w: '100%', h: '100%', valign: 'top'// , align: 'left'
    })
  }
}

export const generateAndDowloadPPT = (variablePptElements) => {
  // initialize ppt
  const pptx = new pptxgen();

  // should be defined as json
  const pptConfig = {

    // style options
    style: {
      coverText1: {
        x: 1, y: 3, w: '100%', h: 0.51, align: 'center', fontSize: 24, bold: true//, color:pptx.SchemeColor.accent1
      },
      coverText2: {
        x: 1, y: 4, w: '100%', h: 0.51, align: 'center', fontSize: 24, bold: true//, color:pptx.SchemeColor.accent1
      },
      tree: {
        x: 0.48, y: 0.54, sizing: { type: 'contain', w: 7.25, h: 5.06 }
      },
      costBar: {
        x: 7.83, y: 0.54, sizing: { type: 'contain', w: 1.97, h: 5.06 }
      },
      title: {
        x: 0, y: 0, w: '100%', h: 0.51, align: 'left', fontSize: 24, bold: true//, color:pptx.SchemeColor.accent1
      },
      leave: {
        x: 4.03, y: 0.55, sizing: { type: 'contain', w: 5.65, h: 4.95 }
      },
    },
  }


  /*   build cover slide   */

  // initialize slide
  const cover = pptx.addSlide();

  // set title
  cover.addText(variablePptElements.schemeName, {
    x: '15%', y: '30%', w: '70%', h: 0.5, align: 'center', fontSize: 24, bold: true//, color:pptx.SchemeColor.accent1
  });

  cover.addText(variablePptElements.scenarioName, {
    x: '15%', y: '40%', w: '70%', h: 0.5, align: 'center', fontSize: 20, bold: false//, color:pptx.SchemeColor.accent1
  });

  cover.addText("[Your Institution Name Here]", {
    x: '25%', y: '55%', w: '50%', h: 0.3, align: 'center', fontSize: 16, bold: false, color: "666666",
  });

  const d = new Date();

  cover.addText(variablePptElements.lang.monthNames[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear(), {
    x: '25%', y: '60%', w: '50%', h: 0.3, align: 'center', fontSize: 16, bold: false, color: "666666",
  });

  // logo institution
  cover.addImage({
    path: variablePptElements.institutionLogo.uri,
    w: variablePptElements.institutionLogo.dimensions.width,
    h: variablePptElements.institutionLogo.dimensions.height,
    ...{ x: '5%', y: '85%', sizing: { type: 'contain', w: '10%', h: '10%' } }
  });

  // logo prosperia
  cover.addImage({
    path: variablePptElements.prosperiaLogo.uri,
    w: variablePptElements.prosperiaLogo.dimensions.width,
    h: variablePptElements.prosperiaLogo.dimensions.height,
    ...{ x: '85%', y: '85%', sizing: { type: 'contain', w: '10%', h: '10%' } }
  });

  if (variablePptElements.descriptionJson && variablePptElements.descriptionJson.content) {
    const slide = pptx.addSlide();
    const content = variablePptElements.descriptionJson.content;

    addMethodologySlide(content, slide);
  }


  if (variablePptElements.tree && variablePptElements.costBar) {
    /*   build tree & bar slide   */

    var slide = pptx.addSlide();

    slide.addText(variablePptElements.scenarioName, pptConfig.style.title);
  
    slide.addImage({
      path: variablePptElements.tree.uri,
      w: variablePptElements.tree.dimensions.width,
      h: variablePptElements.tree.dimensions.height,
      ...pptConfig.style.tree
    });
  
    slide.addImage({
      path: variablePptElements.costBar.uri,
      w: variablePptElements.costBar.dimensions.width,
      h: variablePptElements.costBar.dimensions.height,
      ...pptConfig.style.costBar
    });

    /*   build tree description slide   */

    let descriptionSlide = pptx.addSlide(); 

    descriptionSlide.addText(variablePptElements.scenarioName, pptConfig.style.title); 

    descriptionSlide.addImage({
      path: variablePptElements.tree.uri,
      w: variablePptElements.tree.dimensions.width,
      h: variablePptElements.tree.dimensions.height,
      ...{ x: 0.3 + 2.6, y: 0.54, sizing: { type: 'contain', w: 7.1, h: 5.06 } }
    });

    // description textbox
    descriptionSlide.addText(
      [
        { text: 'Description Title', options: { fontSize: 18, bold: true } },
        { text: 'Description item 1', options: { fontSize: 16, color: "666666", bullet: true } },
        { text: 'Description item 2', options: { fontSize: 16, color: "666666", bullet: true } },
        { text: 'Description item 3', options: { fontSize: 16, color: "666666", bullet: true } },
        { text: 'Description item 4', options: { fontSize: 16, color: "666666", bullet: true } },
        { text: 'Description item 5', options: { fontSize: 16, color: "666666", bullet: true } },
      ],
      { x: 0.3, y: 0.75, w: 2.8, h: 4.56, align: 'left', paraSpaceAfter: 8, valign: 'top' }
    );
  }

  /*   Leaves Slides   */

  // loop through array of leaves
  const arrayLength = variablePptElements.leaves.length;

  for (let i = 0; i < arrayLength; i++) {

    const leave = variablePptElements.leaves[i]

    // initialize slide
    const _slide = pptx.addSlide();

    // set title
    _slide.addText("Detailed view on subgroup " + (i + 1).toString(), pptConfig.style.title);

    // leave image
    _slide.addImage({
      path: leave.uri,
      w: leave.dimensions.width,
      h: leave.dimensions.height,
      ...pptConfig.style.leave
    });

    // leave description textbox
    _slide.addText(
      [
        { text: 'Description Title', options: { fontSize: 18, bold: true } },
        { text: 'Description item 1', options: { fontSize: 16, color: "666666", bullet: true } },
        { text: 'Description item 2', options: { fontSize: 16, color: "666666", bullet: true } },
        { text: 'Description item 3', options: { fontSize: 16, color: "666666", bullet: true } },
        { text: 'Description item 4', options: { fontSize: 16, color: "666666", bullet: true } },
        { text: 'Description item 5', options: { fontSize: 16, color: "666666", bullet: true } },
      ],
      { x: 0.36, y: 0.75, w: 3.68, h: 4.56, align: 'left', paraSpaceAfter: 8, valign: 'top' }
    );
  }

  pptx.writeFile(variablePptElements.schemeName.replace(/ /g, "") + '-' + d.toISOString().slice(0, 10).replace(/-/g, ""));
} 