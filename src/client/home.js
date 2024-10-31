export const home = function () {
  const html = `
  <h1>Eulenmühle Spende</h1>
    <form action="/pay" method="post">
    <input type="number" name="amount" id="donation-amount">
    <input type="submit" value="Spenden" />
  </form>
  `;

  return html;
};
