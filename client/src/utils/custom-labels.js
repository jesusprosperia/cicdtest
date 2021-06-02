export default function getCustomLabel(value, sections) {
  var sortedSections = (sections || []).slice().sort((a, b) => a.value - b.value);
  var section = null;
  var prevSection = null;

  for (let i = 0; i < sortedSections.length; i++) {
      if (value <= sortedSections[i].value) {
          section = sortedSections[i];

          if (i > 0) {
              prevSection = sortedSections[i - 1];
          }

          break;
      }
  }

  var realValue = prevSection ? value - prevSection.value : value;

  return section ? section.name + realValue : value;
}