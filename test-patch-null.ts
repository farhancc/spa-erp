async function main() {
  const serviceId = 'cmql3vcbf000i11tzzr6e7v4v';
  const tenantSlug = 'lavendrsopa';

  console.log('Logging in...');
  const loginRes = await fetch(`http://localhost:3001/api/v1/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-slug': tenantSlug,
    },
    body: JSON.stringify({
      phone: '9961155799',
      password: 'password123',
    }),
  });

  const loginData = await loginRes.json() as any;
  const token = loginData.data.token;

  const url = `http://localhost:3001/api/v1/services/${serviceId}`;
  const payload = {
    name: "Signature Hair Sculpting (Updated)",
    category: "Grooming",
    price: 850,
    duration: 45,
    gender: "MEN",
    tags: ["grooming", "hair", "new-tag"],
    offerPrice: null,
  };

  console.log('Sending PATCH request with offerPrice null...');
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-slug': tenantSlug,
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  console.log('PATCH STATUS:', res.status);
  const body = await res.json() as any;
  console.log('PATCH RESPONSE:', JSON.stringify(body, null, 2));
}

main();
