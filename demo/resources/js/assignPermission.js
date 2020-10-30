(async function () {
  try {
    // await checkUserPermission();
    const data = await generateTableBody();
    if (data.length === 0) {
      handleTableNoData();
    }

    const rows = [...document.querySelectorAll('#assignPermission__table tbody tr')];
    for (let i = 0; i < rows.length; i++) {
      Array.from(rows[i].children).forEach((item) => {
        if (item.innerHTML.includes('checkbox')) {
          switch (item.children[0].name) {
            case 'read':
            case 'create':
            case 'edit':
            case 'delete':
              item.children[0].checked = data[i][`${item.children[0].name}`] ? true : false;
              break;
            default:
              break;
          }
        }
      });
    }
  } catch (err) {
    console.log(err);
  }
})();

async function generateTableBody() {
  try {
    const tableHeader = document.querySelector('#assignPermission__table thead tr:nth-child(2)');
    const tableBody = document.querySelector('#assignPermission__table tbody');

    let data = [
      { type: 'Account', read: true, create: false, edit: false, delete: true },
      { type: 'App Analytics Query Requests', read: false, create: true, edit: false, delete: false },
      { type: 'Assets', read: false, create: false, edit: true, delete: true },
      { type: 'Authorization Form', read: false, create: false, edit: true, delete: false },
      { type: 'Authorization Form Consent', read: false, create: false, edit: false, delete: false },
      { type: 'Authorization Form Data Use', read: false, create: false, edit: false, delete: false },
      { type: 'Authorization Form Text', read: false, create: false, edit: false, delete: false },
      { type: 'Campaigns', read: false, create: false, edit: false, delete: false },
      { type: 'Cases', read: false, create: false, edit: false, delete: false },
    ];

    let actions = data[0] ? Object.keys(data[0]).filter((d) => d !== 'type') : ['read', 'create', 'edit', 'delete'];
    let headerResult = `<th scope="col"></th>`;
    let bodyResult = '';

    for (let i = 0; i < actions.length; i++) {
      headerResult += `<th scope="col">${actions[i].replace(/^\S/, (s) => s.toUpperCase())}</th>`;
    }

    for (let i = 0; i < data.length; i++) {
      bodyResult += `
        <tr>
          <th scope="row">${data[i].type}</th>
          <td><input type="checkbox" name="${actions[0]}"></td>
          <td><input type="checkbox" name="${actions[1]}"></td>
          <td><input type="checkbox" name="${actions[2]}"></td>
          <td><input type="checkbox" name="${actions[3]}"></td>
        </tr>
      `;
    }

    tableHeader.innerHTML = headerResult;
    tableBody.innerHTML = bodyResult;
    return data;
  } catch (err) {
    console.log(err);
  }
}

function handleTableNoData() {
  $('#assignPermission__table tbody').remove();
  $('#assignPermission__table').after(function () {
    return `<p class="assignPermission__table--noData paragraph">No Data. Please try again later!</p>`;
  });
  $('.saveButton').attr('disabled', true);
}

$('.saveButton').click(() => {
  let target = [...document.querySelectorAll('#assignPermission__table tbody tr')];

  let tableInfo = target.map((d) => {
    let row = {
      type: null,
      read: false,
      create: false,
      edit: false,
      delete: false,
    };

    Array.from(d.children).forEach((item) => {
      if (!item.innerHTML.includes('checkbox')) {
        row.type = item.innerText;
      } else {
        switch (item.children[0].name) {
          case 'read':
          case 'create':
          case 'edit':
          case 'delete':
            row[`${item.children[0].name}`] = item.children[0].checked;
            break;
          default:
            break;
        }
      }
    });

    return row;
  });
  console.log('tableInfo', tableInfo);
});
