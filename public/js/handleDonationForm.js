const form = document.getElementById('donationForm');
const donationAmountInputs = form.querySelectorAll('.amount-wrapper input');
const donationAmountField = document.getElementById('donationAmountField');

/* Checks if a radio input field is checked.
 * Returns true or false. */
function isChecked(input) {
  return input.checked;
}

/* Unchecks a all donation amount radio inputs. */
function uncheckDonationAmountInputs() {
  donationAmountInputs.forEach((input) => {
    input.checked = false;
  });
}

function setSubmitButtonTextContent(amount) {
  const submitButton = document.querySelector('form button[type="submit"');

  if (amount) {
    submitButton.textContent = `Jetzt ${amount}€ spenden`;
  } else {
    submitButton.textContent = `Jetzt spenden`;
  }
}

/* Sets the value of the donation amount input fieldto the
 * amount selected via the donation amount radio inputs. */
function setDonationAmount(input) {
  if (isChecked(input)) {
    let inputValue = input.value;
    donationAmountField.value = inputValue;

    return inputValue;
  }
}

/* Adds event listener "change" to the donation amount radio inputs.
 * Sets the selected amount as value of the donation amount input field. */
donationAmountInputs.forEach((input) => {
  input.addEventListener('change', () => {
    const amount = setDonationAmount(input);
    setSubmitButtonTextContent(amount);
  });
});

/* Adds event listener "input" to the donation amount input field.
 * Unchecks all donation amount radio inputs when triggered. */
donationAmountField.addEventListener('input', () => {
  uncheckDonationAmountInputs();
  setSubmitButtonTextContent(donationAmountField.value);
});
