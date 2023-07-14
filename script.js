const form = document.getElementById('form');
const btn = document.getElementById('submit-btn');
const toolTip = document.getElementById('tooltip');
const synsWrapper = document.getElementById('syn-wrapper');
const filterMatches = 2;
const textBox = document.getElementById('input-text');
const dupWordBox = document.getElementById('duplicated-words-box');

// Flags
let editing = false;
let isSubmitting = false;

// Homemade placeholder 
const placeholder = textBox.getAttribute('data-placeholder');
// Set the placeholder as initial content if it's empty
if (textBox.innerText == '') textBox.innerText = placeholder;

textBox.addEventListener('focus', function (e) {
  const value = e.target.innerHTML;
  if (value == placeholder) e.target.innerHTML = '';
});

textBox.addEventListener('blur', function (e) {
  const value = e.target.innerHTML;
  if (value == '') e.target.innerHTML = placeholder;
});


// submit handling
form.addEventListener('submit', submitHandler);

// Handles repeated words
function submitHandler(e) {
  e.preventDefault();

  if (isSubmitting) {
    return;
  }
  isSubmitting = true;

  if (!editing) updateInput();
  else editingMode();

  // prevent spam submits
  setTimeout(() => {
    isSubmitting = false;
  }, 1000 / 2);
}

// Handles submit & input changes
function updateInput() {
  editing = true;

  // Turns off editing
  textBox.setAttribute("contenteditable", false);
  textBox.classList.add('check');
  btn.value = 'Edit';

  const text = textBox.innerText;
  const words = text.split(/\b/);

  // Clear html
  textBox.innerHTML = '';

  punctRegEx = new RegExp('\\W+', 'g');
  const wordMap = new Map();

  words.forEach(word => {
    // Adding punctuation & spaces 
    if (punctRegEx.test(word)) {
      textBox.innerHTML += word;
      return;
    }

    // Reconstructing html with span around words
    const lowerCaseWord = word.toLowerCase();

    const wordSpan = document.createElement('span');
    wordSpan.setAttribute('id', lowerCaseWord);
    const wordNode = document.createTextNode(word);
    wordSpan.appendChild(wordNode);
    textBox.appendChild(wordSpan);

    // Wordmap for repeat check
    if (!wordMap.has(lowerCaseWord)) {
      wordMap.set(lowerCaseWord, 1);
    }
    else {
      wordMap.set(lowerCaseWord, wordMap.get(lowerCaseWord) + 1);
    }
  });

  // Clearing non duplicates
  wordMap.forEach((repeats, word) => {
    if (repeats == 1) wordMap.delete(word);
  });

  // Finding and styling repeated words
  let num = 1;
  wordMap.forEach((_, word) => {
    duplicatedWords = document.querySelectorAll(`#${word.toLowerCase()}`);

    // Styling and handling duplicated words
    duplicatedWords.forEach(duplicatedWord => {
      const highlightSpan = document.createElement('span');
      highlightSpan.classList.add('highlight');
      highlightSpan.style.backgroundColor = selectColor(num);

      duplicatedWord.classList.add('duplicated-word');
      duplicatedWord.appendChild(highlightSpan);
    });

    num += 10;
  });
}

// Tooltip
document.addEventListener('click', e => {
  synsWrapper.innerHTML = '';

  // If clicked on duplicated word
  if (e.target.className == 'duplicated-word') {

    const promise = fetchThesaurus(e.target.id, 6);
    promise.then((syns) => {
      // Visibility
      toolTip.style.display = 'block';

      // Content
      syns.forEach(syn => {
        const synSpan = document.createElement('span');
        synSpan.innerText = syn;
        synSpan.classList.add('syns');
        synsWrapper.appendChild(synSpan);

        // Click syn handler
        synSpan.addEventListener('click', () => {
          synsHandler(synSpan, e.target);
        });
      });

    }).catch(() => {
      console.log('no synonyms found');
      toolTip.style.display = 'none';
    });

    // Positioning
    toolTip.style.left = `${e.clientX}px`;
    toolTip.style.top = `${e.clientY}px`;
  }

  // Clicked off word
  else {
    toolTip.style.display = 'none';
  }
});

function synsHandler(syn, oldWord) {
  // Changing text node
  oldWord.childNodes[0].nodeValue = syn.innerText;
  updateInput();
}


// For edit mode
function editingMode() {
  editing = false;

  textBox.classList.remove('check');
  textBox.setAttribute("contenteditable", true);

  btn.value = 'Check for duplicates';

  textBox.innerHTML = textBox.innerText;
}


// Random pastel color gen
function selectColor(number) {
  const hue = number * 137.508;
  return `hsl(${hue},50%,75%)`;
}

// Fetching thesaurus API
async function fetchThesaurus(word, amount) {
  const url = `https://dictionaryapi.com/api/v3/references/thesaurus/json/${word}?key=6e7f6098-7561-4c56-b013-ed0c4556ca66`;
  let syns = [];

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const rJson = await response.json();

    // getting all syns
    rJson.forEach(ele => {
      const synsData = ele.meta.syns;
      synsData.forEach(syn => {
        syns.push(...syn);
      });
    });
  } catch (error) {
    reject(`Could not get synonyms: ${error}`);
  }

  return syns.slice(0, 6);
}



