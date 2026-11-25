const { test, expect } = require('@playwright/test');

test('dashboard action counts reconcile and rates follow the selected period', async ({ page }) => {
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/partner-demo.html');
  const samples={30:[3842,586,214,14280,'15.3%','5.6%'],7:[842,124,48,3200,'14.7%','5.7%'],ytd:[28420,4128,1620,108420,'14.5%','5.7%']};
  for(const [period,[views,clicks,directions,searches,clickRate,directionRate]] of Object.entries(samples)){
    await page.getByLabel('Sample reporting period').selectOption(period);
    await expect(page.locator('#click-rate')).toHaveText(clickRate);
    await expect(page.locator('#direction-rate')).toHaveText(directionRate);
    const totals=await page.locator('#action-data tr').evaluateAll(rows=>rows.reduce((sum,row)=>{
      const cells=row.querySelectorAll('td');
      return [sum[0]+Number(cells[1].textContent.replaceAll(',','')),sum[1]+Number(cells[2].textContent.replaceAll(',',''))];
    },[0,0]));
    expect(totals).toEqual([clicks,directions]);
    const entries=await page.locator('#discovery-sources .amount').allTextContents();
    expect(entries.reduce((sum,text)=>sum+Number(text.replaceAll(',','')),0)).toBe(views);
    await page.getByRole('button',{name:'Market',exact:true}).click();
    const regions=await page.locator('#region-searches strong').allTextContents();
    expect(regions.reduce((sum,text)=>sum+Number(text.replaceAll(',','').replace(' searches','')),0)).toBe(searches);
    await expect(page.locator('#market-details')).toBeVisible();
    await expect(page.locator('#dashboard-details')).toBeHidden();
    await expect(page.getByRole('note')).toContainText('FICTIONAL DEMONSTRATION');
    await page.getByRole('button',{name:'Overview',exact:true}).click();
  }
  expect(errors).toEqual([]);
});

test('analytics fit narrow screens and stay scoped to their dashboard section', async ({page})=>{
  await page.setViewportSize({width:320,height:740});
  await page.goto('/partner-demo.html?store=%3Cscript%3Eexample%3C%2Fscript%3E');
  await expect(page.locator('#welcome')).toContainText('<script>example</script>');
  await expect(page.getByRole('heading',{name:'What the metrics mean'})).toBeVisible();
  await page.getByText('View action counts as a table',{exact:true}).click();
  await expect(page.locator('#action-data tr')).toHaveCount(4);
  for(const tab of ['Overview','Market','Community','Profile']){
    await page.getByRole('button',{name:tab,exact:true}).click();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);
    await expect(page.getByRole('note')).toBeVisible();
    await expect(page.locator('#dashboard-details')).toBeVisible({visible:tab==='Overview'});
    await expect(page.locator('#market-details')).toBeVisible({visible:tab==='Market'});
  }
});
