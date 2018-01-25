using Microsoft.AspNetCore.Mvc;
using Microsoft.WindowsAzure.Storage;
using System;

namespace FileUploadExample.Controllers
{
    [Route("api/[controller]")]
    public class StorageController
        : Controller
    {
        [HttpGet]
        public string Get()
        {
            // To create the account SAS, you need to use your shared key credentials. Modify for your account.
            const string connectionString = "DefaultEndpointsProtocol=https;AccountName=jwfileuploadtest;AccountKey=eiUaw83G79nZQJoTifsNRrCwdrlUCngCQX8KeoNj8ls2QrtCBJMVW9mmJ1tn3qKYSWmeS8vhzabRVzwXJwfTug==;EndpointSuffix=core.windows.net";
            var storageAccount = CloudStorageAccount.Parse(connectionString);

            // Create a new access policy for the account.
            SharedAccessAccountPolicy policy = new SharedAccessAccountPolicy()
            {
                Permissions = SharedAccessAccountPermissions.Read | SharedAccessAccountPermissions.Write | SharedAccessAccountPermissions.Create | SharedAccessAccountPermissions.List | SharedAccessAccountPermissions.Update | SharedAccessAccountPermissions.Delete,
                Services = SharedAccessAccountServices.Blob | SharedAccessAccountServices.File,
                ResourceTypes = SharedAccessAccountResourceTypes.Service | SharedAccessAccountResourceTypes.Object | SharedAccessAccountResourceTypes.Container,
                SharedAccessExpiryTime = DateTime.UtcNow.AddHours(24),
                Protocols = SharedAccessProtocol.HttpsOnly
            };

            // Return the SAS token.
            return storageAccount.GetSharedAccessSignature(policy);
        }
    }
}
