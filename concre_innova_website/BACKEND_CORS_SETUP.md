# Configuración de CORS para backend ASP.NET Core

Tu problema actual de `fetch` no es el JSON: el formato es correcto. El problema es que el servidor no está devolviendo el header `Access-Control-Allow-Origin`.

## Si usas .NET 6+ con `Program.cs`

Agrega lo siguiente en tu `Program.cs`:

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactLocal", policy =>
        policy
            .WithOrigins("http://localhost:3000")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials());
});
builder.Services.AddControllers();
// ... otros servicios

var app = builder.Build();

app.UseHttpsRedirection();
app.UseCors("AllowReactLocal");
app.UseAuthorization();
app.MapControllers();
app.Run();
```

## Si usas `Startup.cs`

### En `ConfigureServices`

```csharp
public void ConfigureServices(IServiceCollection services)
{
    services.AddCors(options =>
    {
        options.AddPolicy("AllowReactLocal", policy =>
            policy
                .WithOrigins("http://localhost:3000")
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials());
    });

    services.AddControllers();
    // ... otros servicios
}
```

### En `Configure`

```csharp
public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
{
    if (env.IsDevelopment())
    {
        app.UseDeveloperExceptionPage();
    }

    app.UseHttpsRedirection();
    app.UseRouting();

    app.UseCors("AllowReactLocal");

    app.UseAuthorization();

    app.UseEndpoints(endpoints =>
    {
        endpoints.MapControllers();
    });
}
```

## Notas importantes

- La URL de Swagger `https://localhost:7258/swagger/index.html` es solo la UI de documentación.
- El endpoint correcto es `https://localhost:7258/api/Auth/login`.
- El POST JSON correcto es:

```json
{
  "correo": "cliente@correo.com",
  "contrasena": "Jose123"
}
```

## Qué hacer si sigues con error

1. Asegúrate de que el backend esté corriendo.
2. Haz la prueba desde Swagger UI.
3. Si funciona desde Swagger y no desde React, el problema es CORS.
4. Si no funciona desde Swagger, entonces el endpoint o el modelo JSON están incorrectos.

> Nota: en este workspace no se encontró ningún archivo `Program.cs`, `Startup.cs` ni proyecto backend. Si me muestras el `Program.cs` o `Startup.cs` del backend, puedo insertar el código exacto allí.
